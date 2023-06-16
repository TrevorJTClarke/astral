import { useRouter } from 'next/router';

export const ActiveLink = ({ children, href, className, activeClassName, }: any) => {
  const router = useRouter();
  const classes = router.asPath === href ? activeClassName : className

  const handleClick = (e: any) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <a href={href} target="" onClick={handleClick} className={classes}>
      {children}
    </a>
  );
}