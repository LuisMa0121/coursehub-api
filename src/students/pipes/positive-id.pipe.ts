import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PositiveIdPipe implements PipeTransform<{ id: string }, number> {
  transform(params: { id: string }): number {
    // Recibe el objeto de parámetros para conservar el texto original de la URL.
    const value = params.id;
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException(
        'El id debe ser un número entero positivo válido',
      );
    }
    return id;
  }
}
