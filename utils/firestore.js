import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

const db = getFirestore();

/**
 * Add a document to Firestore
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {object} data - The data to add.
 * @returns {string} - The ID of the added document.
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document added with ID: ${docRef.id}`);
    return docRef.id;
  } catch (err) {
    console.error("Error adding document: ", err);
    throw err;
  }
};

/**
 * Get all documents from a Firestore collection
 * @param {string} collectionName - The name of the Firestore collection.
 * @returns {Array} - An array of documents with their IDs and data.
 */
export const getDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id, // Firestore document ID
      ...doc.data(), // Document data
    }));
  } catch (err) {
    console.error("Error getting documents: ", err);
    throw err;
  }
};

/**
 * Update a document in Firestore
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to update.
 * @param {object} data - The data to update.
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    console.log(`Document with ID ${docId} updated in ${collectionName}`);
  } catch (err) {
    console.error("Error updating document: ", err);
    throw err;
  }
};

/**
 * Delete a document from Firestore
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {string} docId - The ID of the document to delete.
 */
export const deleteDocument = async (collectionName, docId) => {
  if (!docId) {
    console.error("Error: Document ID is undefined.");
    throw new Error("Invalid Document ID.");
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Document with ID ${docId} deleted from ${collectionName}`);
  } catch (err) {
    console.error("Error deleting document:", err);
    throw err;
  }
};

/**
 * Handle the removal of an item, deleting it from Firestore and updating the UI.
 * @param {string} collectionName - The name of the Firestore collection.
 * @param {object} item - The item to delete, with `id` or `uid`.
 * @param {function} setUsers - State setter function to update the UI.
 */
export const handleRemove = async (collectionName, item, setUsers) => {
  console.log("Attempting to delete:", item);

  // Ensure the item has either `id` or `uid`
  const identifier = item.id || item.uid;
  if (!identifier) {
    console.error("Error: Neither `id` nor `uid` is defined.", item);
    return; // Exit early if no identifier is found
  }

  try {
    // Call deleteDocument for the Firestore deletion
    await deleteDocument(collectionName, item.id);

    alert("User deleted successfully!");

    // Update the local state based on the available identifier
    setUsers((prev) =>
      item.id
        ? prev.filter((user) => user.id !== item.id)
        : prev.filter((user) => user.uid !== item.uid)
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    alert("An error occurred while deleting the item.");
  }
};
