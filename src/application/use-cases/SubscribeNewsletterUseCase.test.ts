import { describe, expect, it, vi } from 'vitest';
import { SubscribeNewsletterUseCase } from './SubscribeNewsletterUseCase';

function setup() {
  const service = { subscribe: vi.fn().mockResolvedValue(undefined) };
  return { service, useCase: new SubscribeNewsletterUseCase(service) };
}

describe('SubscribeNewsletterUseCase', () => {
  it('subscribes the trimmed email', async () => {
    const { service, useCase } = setup();
    await useCase.execute('  ana@example.es ');
    expect(service.subscribe).toHaveBeenCalledWith('ana@example.es');
  });

  it('requires an email', async () => {
    const { service, useCase } = setup();
    await expect(useCase.execute('   ')).rejects.toMatchObject({ fieldErrors: { email: 'required' } });
    expect(service.subscribe).not.toHaveBeenCalled();
  });

  it('rejects invalid emails', async () => {
    const { useCase } = setup();
    for (const email of ['ana', 'ana@', 'ana@example', 'ana @example.es', 'ana@example.e']) {
      await expect(useCase.execute(email)).rejects.toMatchObject({ fieldErrors: { email: 'invalidEmail' } });
    }
  });
});
