import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span>
          © {new Date().getFullYear()} {SITE_NAME}. Tutorials for MineOpt.
        </span>
        <span>PitOpt · AutoDesign · SchedOpt</span>
      </div>
    </footer>
  );
}
