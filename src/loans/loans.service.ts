import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import { Loan } from './entities/loan.entity.js';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loansRepository: Repository<Loan>,
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateLoanDto, authenticatedUserId?: number): Promise<Loan> {
    const targetUserId = dto.userId || authenticatedUserId;
    if (!targetUserId) {
      throw new BadRequestException('Se requiere el ID de un usuario para registrar el préstamo');
    }

    const user = await this.usersRepository.findOneBy({ id: targetUserId });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${targetUserId} no encontrado`);
    }

    const book = await this.booksRepository.findOneBy({ id: dto.bookId });
    if (!book) {
      throw new NotFoundException(`Libro con id ${dto.bookId} no encontrado`);
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException(
        'No hay copias disponibles para este libro en este momento',
      );
    }

    // Descontar una copia disponible
    book.availableCopies -= 1;
    await this.booksRepository.save(book);

    const loan = this.loansRepository.create({
      book,
      user,
      status: 'active',
      loanDate: new Date().toISOString(),
    });

    return this.loansRepository.save(loan);
  }

  findAll(): Promise<Loan[]> {
    return this.loansRepository.find({
      relations: { book: true, user: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Loan> {
    const loan = await this.loansRepository.findOne({
      where: { id },
      relations: { book: true, user: true },
    });
    if (!loan) {
      throw new NotFoundException(`Préstamo con id ${id} no encontrado`);
    }
    return loan;
  }

  async findByBook(bookId: number): Promise<Loan[]> {
    const book = await this.booksRepository.findOneBy({ id: bookId });
    if (!book) {
      throw new NotFoundException(`Libro con id ${bookId} no encontrado`);
    }

    return this.loansRepository.find({
      where: { book: { id: bookId } },
      relations: { user: true },
    });
  }

  async returnLoan(id: number): Promise<Loan> {
    const loan = await this.findOne(id);
    if (loan.status === 'returned') {
      throw new BadRequestException('Este préstamo ya fue devuelto con anterioridad');
    }

    loan.status = 'returned';
    loan.returnDate = new Date().toISOString();

    // Reintegrar la copia disponible
    if (loan.book) {
      const book = await this.booksRepository.findOneBy({ id: loan.book.id });
      if (book) {
        book.availableCopies += 1;
        await this.booksRepository.save(book);
      }
    }

    return this.loansRepository.save(loan);
  }

  async remove(id: number): Promise<Loan> {
    const loan = await this.findOne(id);
    await this.loansRepository.remove(loan);
    return { ...loan, id };
  }
}
