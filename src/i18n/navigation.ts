import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const {
  Link: IntlLink,
  usePathname: useIntlPathname,
  useRouter: useIntlRouter,
} = createNavigation(routing);
