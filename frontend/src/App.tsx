// Created by dla 9196
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Nav, Spinner, Navbar, InputGroup, FormControl } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReceiptModal from './components/ReceiptModal';
import { CartPlus, PencilSquare, TrashFill, Search } from 'react-bootstrap-icons';
import ProductSkeleton from './components/ProductSkeleton';
import { useDashboard } from './context/DashboardContext';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { logout } from './store/slices/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import { buildApiUrl, API_BASE_URL } from './config/api';


interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  stock: number;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  image_url?: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface TransactionItem {
  id: number;
  transaction_id: string;
  product_id: string;
  product_name: string;
  price_at_sale: number;
  cost_price_at_sale?: number;
  quantity: number;
}

interface Transaction {
  id: string;
  timestamp: number;
  total_amount: number;
  payment_amount: number;
  change_amount: number;
  discount?: number;
  items: TransactionItem[];
  payment_method: string;
}

interface ProfitLossReportItem {
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  category_name: string;
}

interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage'>('percentage');
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartAnimationTrigger, setCartAnimationTrigger] = useState<boolean>(false);
  const { activeTab, setActiveTab } = useDashboard();
  const dispatch = useAppDispatch();
  const { isAuthenticated, role: userRole } = useAppSelector((state) => state.auth);
  const [profitLossReport, setProfitLossReport] = useState<ProfitLossReportItem[]>([]);
  const [profitLossLoading, setProfitLossLoading] = useState<boolean>(false);
  const [profitFilterStartDate, setProfitFilterStartDate] = useState<string>('');
  const [profitFilterEndDate, setProfitFilterEndDate] = useState<string>('');
  const [profitFilterCategory, setProfitFilterCategory] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState<string>('');
  const [newProductId, setNewProductId] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductCostPrice, setNewProductCostPrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [newProductBarcode, setNewProductBarcode] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('');
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Additional missing states
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    Number(localStorage.getItem('lowStockThreshold')) || 10
  );
  const [users, setUsers] = useState<User[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topProductsLimit, setTopProductsLimit] = useState<number>(10);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'cashier'>('cashier');
  const [dailySalesLoading, setDailySalesLoading] = useState<boolean>(false);
  const [topProductsLoading, setTopProductsLoading] = useState<boolean>(false);
  const [currencySymbol, setCurrencySymbol] = useState<string>('Rp');

  const productFormRef = useRef<HTMLDivElement>(null);
  const categoryFormRef = useRef<HTMLDivElement>(null);
  const userFormRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    toast.info('Logged out successfully.');
  }, [dispatch]);

  const authenticatedFetch = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      handleLogout();
      throw new Error('No authentication token found');
    }

    const headers: HeadersInit = {};

    // Only add Content-Type for non-FormData requests
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(url, { ...options, headers });
      
      // Handle unauthorized or forbidden responses globally
      if (response.status === 401 || response.status === 403) {
        handleLogout(); // Log out if token is invalid or unauthorized
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error: any) {
      if (error.message === 'Authentication failed') {
        throw error;
      }
      console.error('Network error:', error);
      throw new Error('Network error occurred');
    }
  }, [handleLogout]);

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    setCartAnimationTrigger(true);
  }, []);

  const handleBarcodeScan = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeSearchTerm.trim() !== '') {
      try {
        const response = await authenticatedFetch(buildApiUrl(`/products/barcode/${barcodeSearchTerm}`));
        if (!response.ok) {
          toast.error('Produk dengan barcode tersebut tidak ditemukan.');
          return;
        }
        const product: Product = await response.json();
        addToCart(product);
        setBarcodeSearchTerm(''); // Clear the barcode input after successful scan
      } catch (error: any) {
        console.error("Error fetching product by barcode:", error);
        toast.error(`Gagal mencari produk: ${error.message}`);
      }
    }
  }, [authenticatedFetch, addToCart, barcodeSearchTerm]);

  const fetchProductsAndCategories = useCallback(async () => {
    console.log("Fetching products and categories...");
    try {
      const productsResponse = await authenticatedFetch(buildApiUrl('/products'));

      if (!productsResponse.ok) throw new Error(`HTTP error! status: ${productsResponse.status}`);

      const productsData = await productsResponse.json();

      setProducts(productsData);
      setLoading(false);
      console.log("Products data received:", productsData);

      const lowStock = productsData.filter((p: Product) => p.stock <= lowStockThreshold);
      setLowStockProducts(lowStock);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setLoading(false);
    }
  }, [lowStockThreshold, authenticatedFetch]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await authenticatedFetch(buildApiUrl('/categories'));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCategories(data);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error(`Failed to fetch categories: ${error.message}`);
    }
  }, [authenticatedFetch]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let url = buildApiUrl('/transactions');
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', String(new Date(filterStartDate).getTime()));
      if (filterEndDate) params.append('endDate', String(new Date(filterEndDate).getTime()));
      if (params.toString()) url += `?${params.toString()}`;

      const response = await authenticatedFetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTransactions(data);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, authenticatedFetch]);

  const fetchDailySales = useCallback(async () => {
    setDailySalesLoading(true);
    try {
      const response = await authenticatedFetch(buildApiUrl(`/reports/daily-sales?date=${reportDate}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDailySales(data);
    } catch (error: any) {
      console.error("Error fetching daily sales:", error);
      toast.error(`Failed to fetch daily sales: ${error.message}`);
    } finally {
      setDailySalesLoading(false);
    }
  }, [reportDate, authenticatedFetch]);

  const fetchTopProducts = useCallback(async () => {
    setTopProductsLoading(true);
    try {
      const response = await authenticatedFetch(buildApiUrl(`/reports/top-products?limit=${topProductsLimit}`));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTopProducts(data);
    } catch (error: any) {
      console.error("Error fetching top products:", error);
      toast.error(`Failed to fetch top products: ${error.message}`);
    }
  }, [topProductsLimit, authenticatedFetch]);

  const fetchProfitLossReport = useCallback(async () => {
    setProfitLossLoading(true);
    try {
      let url = buildApiUrl('/reports/profit-loss');
      const params = new URLSearchParams();
      if (profitFilterStartDate) params.append('startDate', String(new Date(profitFilterStartDate).getTime()));
      if (profitFilterEndDate) params.append('endDate', String(new Date(profitFilterEndDate).getTime()));
      if (profitFilterCategory) params.append('categoryId', profitFilterCategory);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await authenticatedFetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProfitLossReport(data);
    } catch (error: any) {
      console.error("Error fetching profit/loss report:", error);
      toast.error(`Failed to fetch profit/loss report: ${error.message}`);
    } finally {
      setProfitLossLoading(false);
    }
  }, [profitFilterStartDate, profitFilterEndDate, profitFilterCategory, authenticatedFetch]);

  const fetchUsers = useCallback(async () => {
    if (userRole !== 'admin') return;
    try {
      const response = await authenticatedFetch(buildApiUrl('/users'));
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`Failed to fetch users: ${error.message}`);
    }
  }, [authenticatedFetch, userRole]);

  useEffect(() => {
    if (cartAnimationTrigger) {
      const timer = setTimeout(() => setCartAnimationTrigger(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartAnimationTrigger]);

  const increaseQuantity = (productId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      } else {
        return prevCart.filter(item => item.id !== productId);
      }
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'admin') {
        fetchDailySales();
        fetchTopProducts();
        fetchProfitLossReport();
      }
      fetchTransactions();
      fetchProductsAndCategories();
      fetchCategories();
    }
  }, [fetchDailySales, fetchTopProducts, fetchProfitLossReport, fetchTransactions, fetchProductsAndCategories, fetchCategories, isAuthenticated, userRole]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProductId(product.id);
    setNewProductName(product.name);
    setNewProductPrice(product.price);
    setNewProductCostPrice(product.cost_price || 0);
    setNewProductStock(product.stock);
    setNewProductBarcode(product.barcode || '');
    setNewProductCategory(product.category_id || '');
    setNewProductImagePreview(product.image_url ? `${API_BASE_URL}${product.image_url}` : null);
    if (productFormRef.current) {
      productFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setNewProductId('');
    setNewProductName('');
    setNewProductPrice(0);
    setNewProductCostPrice(0);
    setNewProductStock(0);
    setNewProductBarcode('');
    setNewProductCategory('');
    setNewProductImage(null);
    setNewProductImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewProductImage(file);
      setNewProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async () => {
    if (editingProduct) return;

    const errors: { [key: string]: string } = {};
    if (!newProductId.trim()) errors.newProductId = 'ID Produk tidak boleh kosong.';
    if (!newProductName.trim()) errors.newProductName = 'Nama Produk tidak boleh kosong.';
    if (newProductPrice <= 0) errors.newProductPrice = 'Harga jual harus lebih besar dari 0.';
    if (newProductCostPrice < 0) errors.newProductCostPrice = 'Harga beli tidak boleh negatif.';
    if (newProductStock < 0) errors.newProductStock = 'Stok tidak boleh negatif.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    let imageUrl = null;
    if (newProductImage) {
      const formData = new FormData();
      formData.append('image', newProductImage);
      try {
        const uploadResponse = await authenticatedFetch(buildApiUrl('/upload/image'), {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error(`HTTP error! status: ${uploadResponse.status}`);
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      } catch (uploadError: any) {
        console.error("Error uploading image:", uploadError);
        toast.error(`Failed to upload image: ${uploadError.message}`);
        return;
      }
    }

    try {
      const response = await authenticatedFetch(buildApiUrl('/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newProductId,
          name: newProductName,
          price: newProductPrice,
          cost_price: newProductCostPrice,
          stock: newProductStock,
          barcode: newProductBarcode || null,
          category_id: newProductCategory || null,
          image_url: imageUrl, // Pass the image URL
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      toast.success(data.message);
      fetch(buildApiUrl('/products')).then(res => res.json()).then(setProducts);
      setNewProductId('');
      setNewProductName('');
      setNewProductPrice(0);
      setNewProductStock(0);
      setNewProductImage(null);
      setNewProductImagePreview(null);
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(`Failed to add product: ${error.message}`);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const errors: { [key: string]: string } = {};
    if (!newProductName.trim()) errors.newProductName = 'Nama Produk tidak boleh kosong.';
    if (newProductPrice <= 0) errors.newProductPrice = 'Harga jual harus lebih besar dari 0.';
    if (newProductCostPrice < 0) errors.newProductCostPrice = 'Harga beli tidak boleh negatif.';
    if (newProductStock < 0) errors.newProductStock = 'Stok tidak boleh negatif.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    let imageUrl = editingProduct.image_url; // Keep existing image URL by default
    if (newProductImage) {
      const formData = new FormData();
      formData.append('image', newProductImage);
      try {
        const uploadResponse = await authenticatedFetch(buildApiUrl('/upload/image'), {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error(`HTTP error! status: ${uploadResponse.status}`);
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      } catch (uploadError: any) {
        console.error("Error uploading image:", uploadError);
        toast.error(`Failed to upload image: ${uploadError.message}`);
        return;
      }
    }

    try {
      const response = await authenticatedFetch(buildApiUrl(`/products/${editingProduct.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          price: newProductPrice,
          cost_price: newProductCostPrice,
          stock: newProductStock,
          barcode: newProductBarcode || null,
          category_id: newProductCategory || null,
          image_url: imageUrl, // Pass the image URL
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      toast.success(data.message);
      fetch(buildApiUrl('/products')).then(res => res.json()).then(setProducts);
      handleCancelEdit();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(`Failed to update product: ${error.message}`);
    }
  };

  

  const handlePayment = async () => {
    const totalAfterDiscount = Math.max(0, totalBeforeDiscount - calculatedDiscount);
    const calculatedChange = paymentAmount - totalAfterDiscount;

    if (paymentAmount < totalAfterDiscount) {
      toast.error(`Pembayaran Gagal! Uang yang dibayarkan kurang ${currencySymbol}${(totalAfterDiscount - paymentAmount).toLocaleString()}`);
      return;
    }

    try {
      const transactionResponse = await authenticatedFetch(buildApiUrl('/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_amount: totalAfterDiscount,
          payment_amount: paymentAmount,
          change_amount: calculatedChange,
          cartItems: cart,
          payment_method: paymentMethod,
          discount: calculatedDiscount,
        }),
      });

      if (!transactionResponse.ok) throw new Error(`Failed to record transaction: ${transactionResponse.status}`);
      const transactionData = await transactionResponse.json();

      for (const item of cart) {
        const stockUpdateResponse = await authenticatedFetch(buildApiUrl(`/products/${item.id}/stock`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: item.quantity }),
        });
        if (!stockUpdateResponse.ok) throw new Error(`Failed to update stock for ${item.name}: ${stockUpdateResponse.status}`);
      }

      setCart([]);
      setPaymentAmount(0);
      setDiscount(0);
      setDiscountType('percentage');
      toast.success(`Pembayaran Berhasil! Kembalian: ${currencySymbol}${calculatedChange.toLocaleString()}`);

      setCurrentTransaction({
        id: transactionData.transactionId,
        timestamp: Date.now(),
        total_amount: totalAfterDiscount,
        payment_amount: paymentAmount,
        change_amount: calculatedChange,
        discount: calculatedDiscount,
        items: cart.map(item => ({
          id: 0, // dummy id
          transaction_id: transactionData.transactionId,
          product_id: item.id,
          product_name: item.name,
          price_at_sale: item.price,
          cost_price_at_sale: item.cost_price,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
      });
      setShowReceiptModal(true);

      fetch(buildApiUrl('/products')).then(res => res.json()).then(setProducts);
      fetchTransactions();

    } catch (error: any) {
      console.error("Error during payment process:", error);
      toast.error(`Terjadi kesalahan saat memproses pembayaran: ${error.message}`);
    }
  };

  const handleResetTransactions = async () => {
    if (window.confirm('Apakah Anda yakin ingin mereset semua data transaksi? Tindakan ini tidak dapat diurungkan.')) {
      try {
        const response = await authenticatedFetch(buildApiUrl('/reset-transactions'), { method: 'POST' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        toast.info(data.message);
        fetchTransactions();
      } catch (error: any) {
        console.error("Error resetting transactions:", error);
        toast.error(`Failed to reset transactions: ${error.message}`);
      }
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryId('');
    setNewCategoryName('');
  };

  const handleAddCategory = async () => {
    if (!newCategoryId.trim() || !newCategoryName.trim()) {
      toast.error('ID Kategori dan Nama Kategori tidak boleh kosong.');
      return;
    }
    try {
      const response = await authenticatedFetch(buildApiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newCategoryId, name: newCategoryName }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      toast.success(data.message);
      fetch(buildApiUrl('/categories')).then(res => res.json()).then(setCategories);
      setNewCategoryId('');
      setNewCategoryName('');
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast.error(`Failed to add category: ${error.message}`);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryId(category.id);
    setNewCategoryName(category.name);
    if (categoryFormRef.current) {
      categoryFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    if (!newCategoryName.trim()) {
      toast.error('Nama Kategori tidak boleh kosong.');
      return;
    }
    try {
      const response = await authenticatedFetch(buildApiUrl(`/categories/${editingCategory.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      toast.success(data.message);
      fetch(buildApiUrl('/categories')).then(res => res.json()).then(setCategories);
      handleCancelEditCategory();
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(`Failed to update category: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini? Produk yang terkait mungkin terpengaruh.')) {
      try {
        const response = await authenticatedFetch(buildApiUrl(`/categories/${categoryId}`), {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        toast.success(data.message);
        fetch(buildApiUrl('/categories')).then(res => res.json()).then(setCategories);
      } catch (error: any) {
        console.error("Error deleting category:", error);
        toast.error(`Failed to delete category: ${error.message}`);
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUserUsername.trim() || !newUserPassword.trim()) {
      toast.error('Username and password are required.');
      return;
    }
    try {
      const response = await authenticatedFetch(buildApiUrl('/users'), {
        method: 'POST',
        body: JSON.stringify({ username: newUserUsername, password: newUserPassword, role: newUserRole }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      toast.success(data.message);
      fetchUsers();
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('cashier');
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast.error(`Failed to add user: ${error.message}`);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUserUsername(user.username);
    setNewUserRole(user.role);
    if (userFormRef.current) {
      userFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!newUserUsername.trim()) {
      toast.error('Username is required.');
      return;
    }
    try {
      const response = await authenticatedFetch(buildApiUrl(`/users/${editingUser.id}`), {
        method: 'PUT',
        body: JSON.stringify({ username: newUserUsername, password: newUserPassword, role: newUserRole }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      toast.success(data.message);
      fetchUsers();
      handleCancelEditUser();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await authenticatedFetch(buildApiUrl(`/users/${userId}`), {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        toast.success(data.message);
        fetchUsers();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        toast.error(`Failed to delete user: ${error.message}`);
      }
    }
  };

  const handleCancelEditUser = () => {
    setEditingUser(null);
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserRole('cashier');
  };

  

  useEffect(() => {
    fetchProductsAndCategories();
    fetchCategories();
  }, [fetchProductsAndCategories, fetchCategories]);

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const response = await authenticatedFetch(buildApiUrl(`/products/${productId}`), {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        toast.success(data.message);
        fetchProductsAndCategories(); // Refresh product list
      } catch (error: any) {
        console.error("Error deleting product:", error);
        toast.error(`Failed to delete product: ${error.message}`);
      }
    }
  };

  const totalBeforeDiscount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const calculatedDiscount = discountType === 'percentage' ? (totalBeforeDiscount * discount) / 100 : discount;
  const total = Math.max(0, totalBeforeDiscount - calculatedDiscount);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <h2 className="mt-3 mb-4 text-primary">Dashboard</h2>
            <p className="text-muted">Selamat datang di Dashboard! Bagian ini akan menampilkan ringkasan penjualan, stok, dan informasi penting lainnya.</p>
            <Row className="g-4">
              <Col md={3}>
                <Card className="shadow-sm dashboard-card">
                  <Card.Body>
                    <Card.Title className="fw-bold">Total Pendapatan</Card.Title>
                    <Card.Text className="fs-3 text-success">{currencySymbol}{transactions.reduce((acc, trx) => acc + trx.total_amount, 0).toLocaleString()}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm dashboard-card">
                  <Card.Body>
                    <Card.Title className="fw-bold">Jumlah Produk</Card.Title>
                    <Card.Text className="fs-3 text-info">{products.length}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm dashboard-card">
                  <Card.Body>
                    <Card.Title className="fw-bold">Jumlah Transaksi</Card.Title>
                    <Card.Text className="fs-3 text-warning">{transactions.length}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm dashboard-card">
                  <Card.Body>
                    <Card.Title className="fw-bold">Total Penjualan Hari Ini</Card.Title>
                    <Card.Text className="fs-3 text-primary">{currencySymbol}{(dailySales.reduce((acc, item) => acc + (item.total_revenue || 0), 0)).toLocaleString()}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="mt-5 mb-3 d-flex justify-content-start">
              {userRole === 'admin' && (
                <Button variant="success" className="me-2" onClick={() => setActiveTab('product-management')}>Tambah Produk Baru</Button>
              )}
              <Button variant="info" onClick={() => setActiveTab('reports')}>Lihat Semua Transaksi</Button>
            </div>

            <h3 className="mt-5 mb-3 text-primary">Produk Stok Rendah</h3>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted">Tidak ada produk dengan stok rendah.</p>
            ) : (
              <Row>
                <Col>
                  <table className="table table-striped table-danger table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID Produk</th>
                        <th>Nama Produk</th>
                        <th>Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map(product => (
                        <tr key={product.id}>
                          <td>{product.id}</td>
                          <td>{product.name}</td>
                          <td>{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Col>
              </Row>
            )}

            <h3 className="mt-5 mb-3 text-primary">Penjualan Harian ({new Date(reportDate).toLocaleDateString()})</h3>
            {dailySalesLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              dailySales.length > 0 ? (
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kuantitas Terjual</th>
                      <th>Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySales.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.total_quantity_sold}</td>
                        <td>{currencySymbol}{(item.total_revenue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Tidak ada penjualan untuk tanggal ini.</p>
              )
            )}

            <h3 className="mt-5 mb-3 text-primary">Transaksi Terbaru</h3>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              transactions.length > 0 ? (
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Tanggal</th>
                      <th>Total</th>
                      <th>Metode Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                        <td>{currencySymbol}{transaction.total_amount.toLocaleString()}</td>
                        <td>{transaction.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Tidak ada transaksi terbaru.</p>
              )
            )}
          </div>
        );
      case 'sales':
        console.log("Rendering sales tab. Current products:", products);
        return (
          <Row>
            <Col md={8}>
              <div className="mb-4">
                <InputGroup className="mb-3">
                  <InputGroup.Text><Search /></InputGroup.Text>
                  <FormControl
                    type="text"
                    placeholder="Scan Barcode atau masukkan barcode..."
                    value={barcodeSearchTerm}
                    onChange={(e) => setBarcodeSearchTerm(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                  />
                </InputGroup>
                <InputGroup>
                  <InputGroup.Text><Search /></InputGroup.Text>
                  <FormControl
                    type="text"
                    placeholder="Cari produk berdasarkan nama..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <Row className="g-4 mb-5">
                {loading ? (
                  Array.from({ length: 9 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))
                ) : (
                  products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                    <Col key={product.id} sm={6} md={4} lg={4}>
                      <Card className="product-card rounded" onClick={() => addToCart(product)} style={{ cursor: 'pointer' }}>
                        {product.image_url && (
                          <Card.Img variant="top" src={`${API_BASE_URL}${product.image_url}`} alt={product.name} style={{ height: '150px', objectFit: 'contain', padding: '10px' }} />
                        )}
                        <Card.Body className="d-flex justify-content-between align-items-center">
                          <div>
                            <Card.Title>{product.name}</Card.Title>
                            <Card.Text>{currencySymbol}{product.price.toLocaleString()}</Card.Text>
                            <Card.Text className="text-muted">Stok: {product.stock}</Card.Text>
                          </div>
                          <CartPlus size={24} className="text-primary" />
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Col>
            <Col md={4}>
              <div className="sticky-cart-container">
                <div className={`p-3 border rounded shadow-lg ${cartAnimationTrigger ? 'animate-cart' : ''}`}>
                  <h4 className="mb-3 text-primary">Keranjang Belanja</h4>
                  {cart.length === 0 ? (
                    <p className="text-muted small">Keranjang kosong.</p>
                  ) : (
                    <>
                      <div className="cart-items-container">
                        <table className="table table-sm align-middle">
                          <tbody>
                            {cart.map(item => (
                              <tr key={item.id}>
                                <td>
                                  <div className="small lh-sm">{item.name}</div>
                                  <div className="text-muted small">{currencySymbol}{item.price.toLocaleString()}</div>
                                </td>
                                <td>
                                  <div className="btn-group d-flex align-items-center">
                                    <Button variant="outline-danger" size="sm" onClick={() => decreaseQuantity(item.id)}>-</Button>
                                    <span className="mx-2">{item.quantity}</span>
                                    <Button variant="outline-success" size="sm" onClick={() => increaseQuantity(item.id)}>+</Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 pt-3 border-top">
                        <div className="d-flex justify-content-between align-items-center fw-bold fs-5">
                          <span>Total</span>
                          <span className="text-primary">{currencySymbol}{total.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-top">
                        <div className="mb-3">
                          <label htmlFor="paymentAmount" className="form-label">Jumlah Pembayaran</label>
                          <input
                            type="number"
                            id="paymentAmount"
                            className="form-control"
                            value={paymentAmount === 0 ? '' : paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            min="0"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="discount" className="form-label">Diskon</label>
                          <div className="input-group">
                            <input
                              type="number"
                              id="discount"
                              className="form-control"
                              value={discount === 0 ? '' : discount}
                              onChange={(e) => setDiscount(Number(e.target.value))}
                              min="0"
                            />
                            <select
                              className="form-select"
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                            >
                              <option value="percentage">%</option>
                            </select>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label htmlFor="paymentMethod" className="form-label">Metode Pembayaran</label>
                          <select
                            id="paymentMethod"
                            className="form-select"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          >
                            <option value="Cash">Tunai</option>
                            <option value="Credit Card">Kartu Kredit</option>
                            <option value="Debit Card">Kartu Debit</option>
                          </select>
                        </div>
                        <div className="d-flex justify-content-between align-items-center fw-bold fs-5 mb-3">
                          <span>Kembalian</span>
                          <span className="text-primary">{currencySymbol}{(paymentAmount - total).toLocaleString()}</span>
                        </div>
                        <Button variant="primary" className="w-100" onClick={handlePayment} disabled={cart.length === 0}>Bayar</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        );
      case 'product-management':
        return (
          <ProtectedRoute requiredRole="admin">
            <div>
              <h2 className="mt-3 mb-4 text-primary">Manajemen Produk</h2>
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm" ref={productFormRef}>
                  <Card.Body>
                    <Card.Title className="mb-4 fw-bold">Tambah Produk</Card.Title>
                    <div className="mb-3">
                      <label htmlFor="productId" className="form-label fw-semibold">ID Produk</label>
                      <input type="text" className={`form-control ${formErrors.newProductId ? 'is-invalid' : ''}`} id="productId" value={newProductId} onChange={(e) => {setNewProductId(e.target.value); setFormErrors((prev: { [key: string]: string }) => { const { newProductId, ...rest } = prev; return rest; });}} placeholder="Contoh: P006" disabled={!!editingProduct} />
                      {formErrors.newProductId && <div className="invalid-feedback">{formErrors.newProductId}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productName" className="form-label fw-semibold">Nama Produk</label>
                      <input type="text" className={`form-control ${formErrors.newProductName ? 'is-invalid' : ''}`} id="productName" value={newProductName} onChange={(e) => {setNewProductName(e.target.value); setFormErrors((prev: { [key: string]: string }) => { const { newProductName, ...rest } = prev; return rest; });}} placeholder="Contoh: Sabun Mandi" />
                      {formErrors.newProductName && <div className="invalid-feedback">{formErrors.newProductName}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productPrice" className="form-label fw-semibold">Harga Jual</label>
                      <input type="number" className={`form-control ${formErrors.newProductPrice ? 'is-invalid' : ''}`} id="productPrice" value={newProductPrice === 0 ? '' : newProductPrice} onChange={(e) => {setNewProductPrice(Number(e.target.value)); setFormErrors((prev: { [key: string]: string }) => { const { newProductPrice, ...rest } = prev; return rest; });}} placeholder="Contoh: 5000" />
                      {formErrors.newProductPrice && <div className="invalid-feedback">{formErrors.newProductPrice}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productCostPrice" className="form-label fw-semibold">Harga Beli</label>
                      <input type="number" className="form-control" id="productCostPrice" value={newProductCostPrice === 0 ? '' : newProductCostPrice} onChange={(e) => setNewProductCostPrice(Number(e.target.value))} placeholder="Contoh: 4000" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productStock" className="form-label fw-semibold">Stok</label>
                      <input type="number" className={`form-control ${formErrors.newProductStock ? 'is-invalid' : ''}`} id="productStock" value={newProductStock === 0 ? '' : newProductStock} onChange={(e) => {setNewProductStock(Number(e.target.value)); setFormErrors((prev: { [key: string]: string }) => { const { newProductStock, ...rest } = prev; return rest; });}} placeholder="Contoh: 100" />
                      {formErrors.newProductStock && <div className="invalid-feedback">{formErrors.newProductStock}</div>}
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productBarcode" className="form-label fw-semibold">Barcode (Opsional)</label>
                      <input type="text" className="form-control" id="productBarcode" value={newProductBarcode} onChange={(e) => setNewProductBarcode(e.target.value)} placeholder="Contoh: 1234567890" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="productImage" className="form-label fw-semibold">Gambar Produk (Opsional)</label>
                      <input type="file" className="form-control" id="productImage" accept="image/*" onChange={handleImageChange} />
                      {newProductImagePreview && (
                        <div className="mt-2">
                          <img src={newProductImagePreview} alt="Product Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <label htmlFor="productCategory" className="form-label fw-semibold">Kategori</label>
                      <select
                        id="productCategory"
                        className="form-select"
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    {editingProduct ? (
                      <>
                        <Button variant="warning" onClick={handleUpdateProduct} className="me-2">Update Produk</Button>
                        <Button variant="secondary" onClick={handleCancelEdit}>Batal Edit</Button>
                      </>
                    ) : (
                      <Button variant="success" onClick={handleAddProduct}>Tambah Produk</Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <h3 className="mt-4 mb-3">Daftar Produk</h3>
            {products.length === 0 ? (
              <p className="text-muted">Tidak ada produk untuk ditampilkan.</p>
            ) : (
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Harga Jual</th>
                    <th>Harga Beli</th>
                    <th>Stok</th>
                    <th>Barcode</th>
                    <th>Kategori</th>
                    <th>Gambar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{currencySymbol}{product.price.toLocaleString()}</td>
                      <td>{currencySymbol}{(product.cost_price || 0).toLocaleString()}</td>
                      <td>{product.stock}</td>
                      <td>{product.barcode || '-'}</td>
                      <td>{product.category_name || '-'}</td>
                      <td>
                        {product.image_url && (
                          <img src={`${API_BASE_URL}${product.image_url}`} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                        )}
                      </td>
                      <td>
                        <Button variant="info" size="sm" className="me-2" onClick={() => handleEditProduct(product)}><PencilSquare /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product.id)}><TrashFill /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <div>
            <h2 className="mt-3 mb-4 text-primary">Laporan Penjualan</h2>
            <p className="text-muted">Bagian ini akan menampilkan laporan penjualan harian, produk terlaris, dan riwayat transaksi.</p>

            <h3 className="mt-4 mb-3">Laporan Penjualan Harian</h3>
            <div className="mb-3">
              <label htmlFor="reportDate" className="form-label fw-semibold">Pilih Tanggal:</label>
              <input
                type="date"
                id="reportDate"
                className="form-control w-25"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
            {dailySalesLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              dailySales.length > 0 ? (
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kuantitas Terjual</th>
                      <th>Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySales.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.total_quantity_sold}</td>
                        <td>{currencySymbol}{(item.total_revenue || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Tidak ada penjualan untuk tanggal ini.</p>
              )
            )}

            <h3 className="mt-4 mb-3">Produk Terlaris</h3>
            <div className="mb-3">
              <label htmlFor="topProductsLimit" className="form-label fw-semibold">Jumlah Produk:</label>
              <input
                type="number"
                id="topProductsLimit"
                className="form-control w-25"
                value={topProductsLimit}
                onChange={(e) => setTopProductsLimit(Number(e.target.value))}
                min="1"
              />
            </div>
            {topProductsLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              topProducts.length > 0 ? (
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Total Kuantitas Terjual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.total_quantity_sold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Tidak ada produk terlaris untuk ditampilkan.</p>
              )
            )}

            <h3 className="mt-4 mb-3">Riwayat Transaksi</h3>
            <div className="mb-3 d-flex">
              <div className="me-2">
                <label htmlFor="startDate" className="form-label fw-semibold">Dari Tanggal:</label>
                <input
                  type="date"
                  id="startDate"
                  className="form-control"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="form-label fw-semibold">Sampai Tanggal:</label>
                <input
                  type="date"
                  id="endDate"
                  className="form-control"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <Button variant="primary" className="ms-2 align-self-end" onClick={fetchTransactions}>Filter</Button>
            </div>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              transactions.length > 0 ? (
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Tanggal</th>
                      <th>Total</th>
                      <th>Dibayar</th>
                      <th>Kembalian</th>
                      <th>Metode Pembayaran</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                        <td>{currencySymbol}{transaction.total_amount.toLocaleString()}</td>
                        <td>{currencySymbol}{transaction.payment_amount.toLocaleString()}</td>
                        <td>{currencySymbol}{transaction.change_amount.toLocaleString()}</td>
                        <td>{transaction.payment_method}</td>
                        <td>
                          <ul>
                            {transaction.items.map((item, idx) => (
                              <li key={idx}>{item.product_name} ({item.quantity} x {currencySymbol}{item.price_at_sale.toLocaleString()})</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Tidak ada transaksi untuk ditampilkan.</p>
              )
            )}
            <Button variant="danger" className="mt-3" onClick={handleResetTransactions}>Reset Semua Transaksi</Button>

            <h3 className="mt-5 mb-3">Laporan Laba Rugi</h3>
            <div className="mb-3 d-flex align-items-end">
              <div className="me-2">
                <label htmlFor="profitStartDate" className="form-label fw-semibold">Dari Tanggal:</label>
                <input
                  type="date"
                  id="profitStartDate"
                  className="form-control"
                  value={profitFilterStartDate}
                  onChange={(e) => setProfitFilterStartDate(e.target.value)}
                />
              </div>
              <div className="me-2">
                <label htmlFor="profitEndDate" className="form-label fw-semibold">Sampai Tanggal:</label>
                <input
                  type="date"
                  id="profitEndDate"
                  className="form-control"
                  value={profitFilterEndDate}
                  onChange={(e) => setProfitFilterEndDate(e.target.value)}
                />
              </div>
              <div className="me-2">
                <label htmlFor="profitCategory" className="form-label fw-semibold">Kategori:</label>
                <select
                  id="profitCategory"
                  className="form-select"
                  value={profitFilterCategory}
                  onChange={(e) => setProfitFilterCategory(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <Button variant="primary" onClick={fetchProfitLossReport}>Filter Laba Rugi</Button>
            </div>
            {profitLossLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              profitLossReport.length > 0 ? (
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Kuantitas Terjual</th>
                      <th>Total Pendapatan</th>
                      <th>Total Biaya</th>
                      <th>Laba/Rugi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLossReport.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.category_name || '-'}</td>
                        <td>{item.total_quantity_sold}</td>
                        <td>{currencySymbol}{item.total_revenue.toLocaleString()}</td>
                        <td>{currencySymbol}{item.total_cost.toLocaleString()}</td>
                        <td>{currencySymbol}{item.total_profit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted">Tidak ada data laba rugi untuk ditampilkan.</p>
              )
            )}
          </div>
        );
      case 'category-management':
        return (
          <ProtectedRoute requiredRole="admin">
            <div>
              <h2 className="mt-3 mb-4 text-primary">Manajemen Kategori</h2>
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm" ref={categoryFormRef}>
                  <Card.Body>
                    <Card.Title className="mb-4 fw-bold">Tambah/Edit Kategori</Card.Title>
                    <div className="mb-3">
                      <label htmlFor="categoryId" className="form-label fw-semibold">ID Kategori</label>
                      <input type="text" className="form-control" id="categoryId" value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} placeholder="Contoh: CAT005" disabled={!!editingCategory} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="categoryName" className="form-label fw-semibold">Nama Kategori</label>
                      <input type="text" className="form-control" id="categoryName" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Contoh: Kebersihan" />
                    </div>
                    {editingCategory ? (
                      <>
                        <Button variant="warning" onClick={handleUpdateCategory} className="me-2">Update Kategori</Button>
                        <Button variant="secondary" onClick={handleCancelEditCategory}>Batal Edit</Button>
                      </>
                    ) : (
                      <Button variant="success" onClick={handleAddCategory}>Tambah Kategori</Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <h3 className="mt-4 mb-3">Daftar Kategori</h3>
            {categories.length === 0 ? (
              <p className="text-muted">Tidak ada kategori untuk ditampilkan.</p>
            ) : (
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.name}</td>
                      <td>
                        <Button variant="info" size="sm" className="me-2" onClick={() => handleEditCategory(category)}><PencilSquare /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteCategory(category.id)}><TrashFill /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <div>
            <h2 className="mt-3 mb-4 text-primary">Pengaturan Aplikasi</h2>
            <p className="text-muted">Di sini Anda dapat mengelola pengaturan umum aplikasi.</p>

            <div className="mb-3">
              <label htmlFor="currencySymbolInput" className="form-label fw-semibold">Simbol Mata Uang</label>
              <input
                type="text"
                id="currencySymbolInput"
                className="form-control w-25"
                value={currencySymbol}
                onChange={(e) => {
                  setCurrencySymbol(e.target.value);
                  localStorage.setItem('currencySymbol', e.target.value);
                }}
                maxLength={5}
              />
              <small className="form-text text-muted">Contoh: Rp, $, €</small>
            </div>

            <div className="mb-3">
              <label htmlFor="lowStockThresholdInput" className="form-label fw-semibold">Batas Stok Rendah</label>
              <input
                type="number"
                id="lowStockThresholdInput"
                className="form-control w-25"
                value={lowStockThreshold}
                onChange={(e) => {
                  setLowStockThreshold(Number(e.target.value));
                  localStorage.setItem('lowStockThreshold', e.target.value);
                }}
                min={0}
              />
              <small className="form-text text-muted">Produk dengan stok di bawah batas ini akan ditandai sebagai stok rendah.</small>
            </div>
          </div>
        );
      case 'user-management':
        return (
          <ProtectedRoute requiredRole="admin">
            <div>
              <h2 className="mt-3 mb-4 text-primary">Manajemen Pengguna</h2>
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm" ref={userFormRef}>
                  <Card.Body>
                    <Card.Title className="mb-4 fw-bold">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</Card.Title>
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-semibold">Username</label>
                      <input type="text" className="form-control" id="username" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)} placeholder="Masukkan username" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-semibold">Password</label>
                      <input type="password" className="form-control" id="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password'} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="role" className="form-label fw-semibold">Role</label>
                      <select className="form-select" id="role" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'cashier')}>
                        <option value="cashier">Kasir</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {editingUser ? (
                      <>
                        <Button variant="warning" onClick={handleUpdateUser} className="me-2">Update Pengguna</Button>
                        <Button variant="secondary" onClick={handleCancelEditUser}>Batal Edit</Button>
                      </>
                    ) : (
                      <Button variant="success" onClick={handleAddUser}>Tambah Pengguna</Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <h3 className="mt-4 mb-3">Daftar Pengguna</h3>
            {users.length === 0 ? (
              <p className="text-muted">Tidak ada pengguna untuk ditampilkan.</p>
            ) : (
              <table className="table table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>
                        <Button variant="info" size="sm" className="me-2" onClick={() => handleEditUser(user)}><PencilSquare /></Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}><TrashFill /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </ProtectedRoute>
        );
      default:
        return null;
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Container>Error: {error}</Container>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {!isAuthenticated ? null : (
        <>
          <Col md={12} className="main-content p-4">
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
              <Container>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                  <Nav className="ms-auto">
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
            {renderContent()}
          </Col>
        </>
      )}
      <ReceiptModal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} transaction={currentTransaction} />
      <ToastContainer />
    </div>
  );
}

export default App;