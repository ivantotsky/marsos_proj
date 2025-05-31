import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadFileToStorage = async (file, path) => {
  const storage = getStorage();
  const fileRef = ref(storage, `${path}/${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};
