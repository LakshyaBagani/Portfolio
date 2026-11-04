import { IconArrowUp } from "./Icons";

export default function BackToTop() {
  return (
    <button className="totop" data-go="home" aria-label="Back to top">
      <IconArrowUp className="ar" />
      <svg className="ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24.5" /></svg>
      <span className="lbl">Back to top</span>
    </button>
  );
}
