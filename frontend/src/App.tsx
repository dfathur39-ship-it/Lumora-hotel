import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HotelDock from '@/components/HotelDock';
import AdminGuard from '@/components/AdminGuard';
import Home from '@/pages/Home';
import HotelsList from '@/pages/HotelsList';
import HotelDetail from '@/pages/HotelDetail';
import BookingFlow from '@/pages/BookingFlow';
import Favorites from '@/pages/Favorites';
import Bookings from '@/pages/Bookings';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ResetPasswordWaiting from '@/pages/ResetPasswordWaiting';
import PayPalReturn from '@/pages/PayPalReturn';
import PayPalCancel from '@/pages/PayPalCancel';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminHotels from '@/pages/admin/AdminHotels';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminResetRequests from '@/pages/admin/AdminResetRequests';
import AdminContact from '@/pages/admin/AdminContact';
import AdminRooms from '@/pages/admin/AdminRooms';

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();
  const isBookingFlow = location.pathname.startsWith('/book/');

  return (
    <div className="relative min-h-screen">
      <LoadingScreen onDone={() => setLoaded(true)} />

      {loaded && (
        <>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hotels" element={<HotelsList />} />
              <Route path="/hotels/:id" element={<HotelDetail />} />
              <Route path="/book/:hotelId/:roomId" element={<BookingFlow />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/waiting-approval/:requestId" element={<ResetPasswordWaiting />} />
              <Route path="/payment/paypal/return" element={<PayPalReturn />} />
              <Route path="/payment/paypal/cancel" element={<PayPalCancel />} />
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminLayout />
                  </AdminGuard>
                }
              >
                <Route index element={<AdminDashboard />} />
              <Route path="hotels" element={<AdminHotels />} />
              <Route path="rooms" element={<AdminRooms />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="reset-requests" element={<AdminResetRequests />} />
              <Route path="contact" element={<AdminContact />} />
              </Route>
            </Routes>
          </main>
          <Footer />
          {!isBookingFlow && <HotelDock />}
        </>
      )}
    </div>
  );
}
