import CommandCenter from "./CommandCenter";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";

export default async function AuthenticatedCommandCenter({ initialMathCourse }: { initialMathCourse?: string } = {}) {
  const user = await getChatGPTUser();
  return <CommandCenter
    initialMathCourse={initialMathCourse}
    student={user ? { displayName: user.displayName, email: user.email } : null}
    signInPath={chatGPTSignInPath("/")}
    signOutPath={chatGPTSignOutPath("/")}
  />;
}
