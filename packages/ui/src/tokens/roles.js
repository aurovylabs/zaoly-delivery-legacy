import { zaolyBrand } from './brand';
/** ECHON panel role accents */
export const zaolyRoles = {
    foresight: zaolyBrand.orange,
    research: zaolyBrand.blue,
    waves: zaolyBrand.purple,
    signals: zaolyBrand.pinkOnLight,
    sources: zaolyBrand.green,
    ops: '#64748b',
    corpus: zaolyBrand.orange,
    pipeline: zaolyBrand.blue,
};
export const zaolyRolesDark = {
    ...zaolyRoles,
    ops: '#a3a3a3',
    signals: zaolyBrand.pink,
};
