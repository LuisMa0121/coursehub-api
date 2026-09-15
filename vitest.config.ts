import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import ts from 'typescript';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    {
      name: 'nestjs-decorator-metadata',
      enforce: 'pre',
      transform(source, id) {
        if (!id.endsWith('.ts') || id.includes('/node_modules/')) return;

        // Nest necesita estos metadatos para inyectar servicios y validar DTOs.
        const result = ts.transpileModule(source, {
          fileName: id,
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2023,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
            sourceMap: true,
            inlineSources: true,
          },
        });
        return { code: result.outputText, map: result.sourceMapText };
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
