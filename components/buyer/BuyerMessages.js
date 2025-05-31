import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const UserMessages = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserRoleAndChats = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const role = userSnap.data().role;
          setUserRole(role);

          const allChats = [];

          const chatSources = [
            {
              collectionName: "rfqChats",
              label: "RFQ Inquiry",
              pathBuilder: (id) => `/rfq-chat/${id}`,
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
            {
              collectionName: "productChats",
              label: "Product Inquiry",
              pathBuilder: (id) => `/product-chat/${id}`,
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
            {
              collectionName: "cartChats",
              label: "Cart Inquiry",
              pathBuilder: (id) => `/cart-chat/${id}`,
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
            {
              collectionName: "orderChats",
              label: "Order Inquiry",
              pathBuilder: async (id, data) => {
                let billNumber = data.billNumber || null;
                let totalAmount = null;
                let orderStatus = null;

                if (billNumber) {
                  const orderSnap = await getDoc(doc(db, "orders", billNumber));
                  if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    totalAmount = orderData.totalAmount || null;
                    orderStatus = orderData.orderStatus || null;
                  }
                }

                const encoded = encodeURIComponent(
                  JSON.stringify({ billNumber, totalAmount, orderStatus })
                );
                return `/order-chat/${id}?extraData=${encoded}`;
              },
              filterKey: role === "supplier" ? "supplierId" : "buyerId",
            },
          ];

          for (const source of chatSources) {
            const q = query(
              collection(db, source.collectionName),
              where(source.filterKey, "==", currentUser.uid)
            );

            const snap = await getDocs(q);

            for (const docSnap of snap.docs) {
              const data = docSnap.data();

              const otherPartyId =
                role === "supplier" ? data.buyerId : data.supplierId;

              let otherPartyName = "Unknown";
              if (otherPartyId) {
                const userSnap = await getDoc(doc(db, "users", otherPartyId));
                if (userSnap.exists()) {
                  otherPartyName = userSnap.data().name || "Unknown";
                }
              }

              const path =
                typeof source.pathBuilder === "function"
                  ? await source.pathBuilder(docSnap.id, data)
                  : source.pathBuilder;

              allChats.push({
                id: docSnap.id,
                name: otherPartyName,
                concernType: source.label,
                chatPath: path,
              });
            }
          }

          setChats(allChats);
        }
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndChats();
  }, [currentUser]);

  if (loading || !userRole) {
    return <p className='text-center text-sm mt-4'>Loading messages...</p>;
  }

  return (
    <div className='p-4 max-w-6xl mx-auto'>
      <h2 className='text-xl font-semibold mb-4'>Your Messages</h2>

      {chats.length === 0 ? (
        <p className='text-gray-500 text-center text-sm'>No messages found.</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm text-left border border-gray-200'>
            <thead className='bg-[#2c6449] text-white'>
              <tr>
                <th className='px-4 py-2'>Name</th>
                <th className='px-4 py-2'>Concern Type</th>
                <th className='px-4 py-2'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {chats.map((chat) => (
                <tr key={chat.id}>
                  <td className='px-4 py-2'>{chat.name}</td>
                  <td className='px-4 py-2'>{chat.concernType}</td>
                  <td className='px-4 py-2'>
                    <Link
                      to={chat.chatPath}
                      className='text-white bg-[#2c6449] px-3 py-1 rounded hover:bg-green-700 text-xs'
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserMessages;
