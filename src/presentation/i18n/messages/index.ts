import { common } from './common';
import { errors } from './errors';
import { shell } from './shell';
import { catalog } from './catalog';
import { cart } from './cart';
import { checkout } from './checkout';
import { forms } from './forms';
import { content } from './content';

/**
 * All storefront copy (Spanish, es-ES). Import `messages` and read keys,
 * e.g. `messages.cart.title`. Parameterised strings are functions.
 */
export const messages = { common, errors, shell, catalog, cart, checkout, forms, content } as const;
