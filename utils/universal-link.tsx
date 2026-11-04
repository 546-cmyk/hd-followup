import {
  createElement,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';

interface UniversalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

export const UniversalLink = ({ to, children, ...rest }: UniversalLinkProps) => {
  return createElement('a', { href: to, ...rest }, children);
};

export default UniversalLink;
