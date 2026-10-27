/** What a Server Action returns: the screen shows a toast on failure, so no detail is passed back */
export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false };

// A Server Action call can also throw (no network, an old tab after a deploy). Without this the error reaches
// the error boundary and the whole screen is replaced, instead of the change being undone with a toast
/** Call a Server Action, treating a failed call like an { ok: false } result */
export const callAction = async <T extends object>(
  call: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> => {
  try {
    return await call();
  } catch {
    return { ok: false };
  }
};
