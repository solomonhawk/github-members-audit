import Image from "next/image";
import cx from "clsx";

export function Avatar({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        className,
        "relative rounded-full overflow-hidden leading-[0]"
      )}
    >
      <Image src={src} alt={alt} layout="fill" />
    </div>
  );
}
