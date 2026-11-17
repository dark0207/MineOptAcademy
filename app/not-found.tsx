import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="card auth-card" style={{ textAlign: "center" }}>
        <h1>Page not found</h1>
        <p className="sub">The tutorial or page you are looking for does not exist, or has not been published yet.</p>
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
