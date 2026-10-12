import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { BooksQueryDto } from './dto/books-query.dto.js';
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
    await this.validateCategory(dto.categoryId);
    const book = this.booksRepository.create(dto);
    return this.booksRepository.save(book);
  }

  async findAll(query?: BooksQueryDto): Promise<Book[] | { items: Book[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    // Si no se pasaron parámetros de paginación ni búsqueda, devolver lista directa (para compatibilidad)
    const isPaginated =
      query &&
      (query.page !== undefined ||
        query.limit !== undefined ||
        query.search !== undefined ||
        query.genre !== undefined ||
        query.year !== undefined ||
        query.categoryId !== undefined ||
        query.sortBy !== undefined || query.order !== undefined);

    if (!isPaginated) {
      return this.booksRepository.find({ relations: { category: true } });
    }

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const sortBy = query?.sortBy ?? 'id';
    const order = query?.order ?? 'ASC';

    const qb = this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category');

    if (query?.search) {
      qb.andWhere(
        '(LOWER(book.title) LIKE LOWER(:search) OR LOWER(book.author) LIKE LOWER(:search))',
        { search: `%${query.search.trim()}%` },
      );
    }

    if (query?.genre) {
      qb.andWhere('LOWER(book.genre) LIKE LOWER(:genre)', {
        genre: `%${query.genre.trim()}%`,
      });
    }

    if (query?.year) {
      qb.andWhere('book.year = :year', { year: query.year });
    }

    if (query?.categoryId) {
      qb.andWhere('book.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    qb.orderBy(`book.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!book) {
      throw new NotFoundException(`No existe el libro con id ${id}`);
    }
    if (book.category === null) {
      delete book.category;
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
    await this.validateCategory(dto.categoryId);
    Object.assign(book, dto);
    return this.booksRepository.save(book);
  }

  private async validateCategory(id?: number | null): Promise<void> {
    if (id != null && !(await this.booksRepository.manager.getRepository(Category).existsBy({ id }))) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }
  }

  async remove(id: number): Promise<Book> {
    const book = await this.findOne(id);
    await this.booksRepository.remove(book);
    return { ...book, id };
  }
}
