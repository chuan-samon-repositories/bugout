import { describe, expect, it } from 'vitest';
import { GetProductsUseCase } from './GetProductsUseCase';
import { GetProductBySlugUseCase } from '@/application/use-cases/GetProductBySlugUseCase';
import { InMemoryProductRepository } from '@/application/testing/fakes';
import { buildProduct } from '@/domain/testing/buildProduct';
import { NotFoundError } from '@/domain/errors';

describe('GetProductsUseCase', () => {
  it('returns every product from the repository', async () => {
    const products = [buildProduct({ id: 'a' }), buildProduct({ id: 'b' })];
    const result = await new GetProductsUseCase(new InMemoryProductRepository(products)).execute();
    expect(result.map((product) => product.id.value)).toEqual(['a', 'b']);
  });

  it('propagates repository failures', async () => {
    const repository = new InMemoryProductRepository();
    repository.findAll = () => Promise.reject(new Error('offline'));
    await expect(new GetProductsUseCase(repository).execute()).rejects.toThrow('offline');
  });
});

describe('GetProductBySlugUseCase', () => {
  const repository = new InMemoryProductRepository([buildProduct({ id: 'kit', slug: 'mochila-72h' })]);

  it('finds a product by slug', async () => {
    const product = await new GetProductBySlugUseCase(repository).execute('mochila-72h');
    expect(product.id.value).toBe('kit');
  });

  it('propagates NotFoundError', async () => {
    await expect(new GetProductBySlugUseCase(repository).execute('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});
