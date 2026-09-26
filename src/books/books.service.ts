import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {}

  async create(dto: CreateBookDto): Promise<Book> {
    const existing = await this.booksRepository.findOneBy({ isbn: dto.isbn });
    if (existing) {
      throw new ConflictException(
        `Ya existe un libro con el ISBN ${dto.isbn}`,
      );
    }
    const book = this.booksRepository.create(dto);
    return this.booksRepository.save(book);
  }

  findAll(): Promise<Book[]> {
    return this.booksRepository.find();
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOneBy({ id });
    if (!book) {
      throw new NotFoundException(`No existe el libro con id ${id}`);
    }
    return book;
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    if (dto.isbn !== undefined && dto.isbn !== book.isbn) {
      const existing = await this.booksRepository.findOneBy({ isbn: dto.isbn });
      if (existing) {
        throw new ConflictException(
          `Ya existe un libro con el ISBN ${dto.isbn}`,
        );
      }
    }
    Object.assign(book, dto);
    return this.booksRepository.save(book);
  }

  async remove(id: number): Promise<Book> {
    const book = await this.findOne(id);
    await this.booksRepository.remove(book);
    return { ...book, id };
  }
}
