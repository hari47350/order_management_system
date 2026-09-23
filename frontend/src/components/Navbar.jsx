import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  ShoppingCart, 
  Package, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  LayoutDashboard, 
  Boxes, 
  Users,
  Layers,
  Sparkles
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/products' && (location.pathname === '/' || location.pathname === '/products')) return true;
    return location.pathname === path;
  };

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
      isActive(path)
        ? 'text-emerald-700 bg-emerald-50/90 shadow-xs'
        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100/70'
    }`;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-900 font-black text-2xl tracking-tighter">
                    Cart<span className="text-emerald-600">To</span>Door
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md shadow-xs">
                    EXPRESS
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 -mt-1 hidden sm:block tracking-wide">
                  From Cart Directly To Your Doorstep
                </span>
              </div>
            </Link>

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link to="/products" className={navLinkClass('/products')}>
                Products
              </Link>

              {isAdmin && (
                <>
                  <Link to="/admin" className={navLinkClass('/admin')}>
                    <span className="flex items-center space-x-1">
                      <LayoutDashboard className="w-4 h-4 mr-1 text-indigo-500" />
                      <span>Dashboard</span>
                    </span>
                  </Link>
                  <Link to="/admin/products" className={navLinkClass('/admin/products')}>
                    Catalog
                  </Link>
                  <Link to="/admin/categories" className={navLinkClass('/admin/categories')}>
                    Categories
                  </Link>
                  <Link to="/admin/inventory" className={navLinkClass('/admin/inventory')}>
                    <span className="flex items-center space-x-1">
                      <Boxes className="w-4 h-4 mr-1 text-indigo-500" />
                      <span>Inventory</span>
                    </span>
                  </Link>
                  <Link to="/admin/orders" className={navLinkClass('/admin/orders')}>
                    Fulfillment
                  </Link>
                  <Link to="/admin/customers" className={navLinkClass('/admin/customers')}>
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4 mr-1 text-indigo-500" />
                      <span>Customers</span>
                    </span>
                  </Link>
                </>
              )}

              {isAuthenticated && !isAdmin && (
                <Link to="/orders" className={navLinkClass('/orders')}>
                  My Orders
                </Link>
              )}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart Icon (Customer Only) */}
            {isAuthenticated && !isAdmin && (
              <Link
                to="/cart"
                className="relative p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition duration-150"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {cart.totalItems}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[110px] truncate">{user.fullName}</span>
                  {isAdmin && (
                    <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide">
                      ADMIN
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2 rounded-xl transition shadow-sm shadow-emerald-500/25"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
