import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto.js';

// Ausente significa "conservar"; null debe seguir siendo inválido.
export class UpdateBookDto extends PartialType(CreateBookDto, {
  skipNullProperties: false,
}) {}
