// store/authThunks.js
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { userAdded, userModified, userRemoved } from "./authSlice";

// This thunk (actually a simple thunk action) subscribes to the entire
// "users" collection and dispatches add/modify/remove as they happen.
export const subscribeToUsers = () => (dispatch) => {
  const usersCol = collection(db, "users");

  const unsubscribe = onSnapshot(usersCol, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const uid = change.doc.id;
      const data = change.doc.data();
      const payload = {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        createdAt: data.createdAt?.toMillis?.() ?? null,
        // …any other schema fields…
      };

      switch (change.type) {
        case "added":
          dispatch(userAdded(payload));
          break;
        case "modified":
          dispatch(userModified(payload));
          break;
        case "removed":
          dispatch(userRemoved({ uid }));
          break;
        default:
          break;
      }
    });
  });

  return unsubscribe;
};
