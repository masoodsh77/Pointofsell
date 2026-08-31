import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { apiRequest } from '../../services/api';
import { toPersianDigits } from '../../utils/persian';
import { Layers, Plus, Edit, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<string>('#f59e0b');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCategories = async () => {
    const res = await apiRequest<Category[]>('/categories');
    if (res.success && res.data) setCategories(res.data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setColor('#f59e0b');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || '#f59e0b');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg(null);
    if (editingCategory) {
      const res = await apiRequest(`/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description, color }),
      });
      if (res.success) {
        setSuccessMsg('دسته‌بندی با موفقیت ویرایش شد.');
        setShowModal(false);
        loadCategories();
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش');
      }
    } else {
      const res = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, description, color }),
      });
      if (res.success) {
        setSuccessMsg('دسته‌بندی جدید اضافه شد.');
        setShowModal(false);
        loadCategories();
      } else {
        setErrorMsg(res.message || 'خطا در ایجاد');
      }
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`آیا از حذف دسته‌بندی "${catName}" اطمینان دارید؟`)) return;
    const res = await apiRequest(`/categories/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('دسته‌بندی حذف شد.');
      loadCategories();
    } else {
      setErrorMsg(res.message || 'خطا در حذف دسته‌بندی');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">دسته‌بندی‌های فروشگاه</h2>
            <p className="text-xs text-slate-400 mt-0.5">گروه‌بندی آجیل، خشکبار، شکلات، زعفران و تنقلات</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن دسته‌بندی جدید</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: cat.color || '#f59e0b' }}
                  />
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                </div>
                <span className="text-[11px] bg-white/5 border border-white/5 text-amber-400 px-2.5 py-0.5 rounded-full font-semibold">
                  {toPersianDigits(cat.productCount || 0)} کالا
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {cat.description || 'بدون توضیحات اضافی'}
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-white/5 flex justify-end gap-1">
              <button
                onClick={() => openEditModal(cat)}
                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="ویرایش دسته‌بندی"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="حذف دسته‌بندی"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نام دسته‌بندی *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: آجیل مخلوط و مغزها"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رنگ برچسب</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-400">{color}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات کوتاه..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
