import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Profile = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto py-8 flex-grow">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Profile</h1>
            <p className="text-gray-600">Welcome, {user.email}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Email:</strong>
                <p>{user.email}</p>
              </div>
              <div>
                <strong>User ID:</strong>
                <p>{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
