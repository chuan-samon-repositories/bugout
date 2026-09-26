import { describe, expect, it, vi } from 'vitest';
import { CONTACT_MESSAGE_MAX_LENGTH, SendContactMessageUseCase } from './SendContactMessageUseCase';
import { ContactMessage } from '../dtos/Contact';
import { FormValidationError } from '../errors';

const valid: ContactMessage = {
  name: 'Ana García',
  email: 'ana@example.es',
  topic: 'order',
  subject: 'Pedido BUG-1234',
  message: '¿Cuándo llegará mi pedido?',
};

function setup() {
  const service = { send: vi.fn().mockResolvedValue(undefined) };
  return { service, useCase: new SendContactMessageUseCase(service) };
}

async function fieldErrorsFor(message: ContactMessage) {
  const error = await setup().useCase.execute(message).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(FormValidationError);
  return (error as FormValidationError).fieldErrors;
}

describe('SendContactMessageUseCase', () => {
  it('sends a trimmed message', async () => {
    const { service, useCase } = setup();
    await useCase.execute({ ...valid, name: ' Ana García ', message: `  ${valid.message}  ` });
    expect(service.send).toHaveBeenCalledWith(valid);
  });

  it('requires every field', async () => {
    expect(await fieldErrorsFor({ ...valid, name: '', email: ' ', subject: '', message: '   ' })).toEqual({
      name: 'required',
      email: 'required',
      subject: 'required',
      message: 'required',
    });
  });

  it('validates the email and topic', async () => {
    expect(await fieldErrorsFor({ ...valid, email: 'ana@' })).toEqual({ email: 'invalidEmail' });
    expect(await fieldErrorsFor({ ...valid, topic: 'spam' as ContactMessage['topic'] })).toEqual({ topic: 'required' });
  });

  it('enforces message length after trimming', async () => {
    expect(await fieldErrorsFor({ ...valid, message: '  corto   ' })).toEqual({ message: 'tooShort' });
    expect(await fieldErrorsFor({ ...valid, message: 'x'.repeat(CONTACT_MESSAGE_MAX_LENGTH + 1) })).toEqual({
      message: 'tooLong',
    });
    const { service, useCase } = setup();
    await useCase.execute({ ...valid, message: 'x'.repeat(CONTACT_MESSAGE_MAX_LENGTH) });
    await useCase.execute({ ...valid, message: 'x'.repeat(10) });
    expect(service.send).toHaveBeenCalledTimes(2);
  });
});
