import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export const getPolishDate = (date: string) =>
  format(new Date(date), 'do MMMM yyyy', {
    locale: pl,
  });

export default getPolishDate;
