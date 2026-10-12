import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category } from './entities/category.entity.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoriesRepository.findOneBy({
      name: dto.name,
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una categoría con el nombre "${dto.name}"`,
      );
    }
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { books: true },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepository.findOneBy({
        name: dto.name,
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${dto.name}"`,
        );
      }
    }
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<Category> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
    return { ...category, id };
  }
}
