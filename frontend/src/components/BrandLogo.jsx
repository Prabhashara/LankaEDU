const lightLogoSrc = "/assets/lankaedu-logo-light.png";
const darkLogoSrc = "/assets/lankaedu-logo-dark.png";

export default function BrandLogo({ className = "", variant = "default" }) {
  const classes = ["brand-logo", `brand-logo-${variant}`, className].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-label="LankaEdu">
      <img
        className="brand-logo-image brand-logo-image-light"
        src={lightLogoSrc}
        alt=""
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
      <img
        className="brand-logo-image brand-logo-image-dark"
        src={darkLogoSrc}
        alt=""
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
    </span>
  );
}
