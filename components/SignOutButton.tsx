export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
      >
        Sign out
      </button>
    </form>
  );
}
