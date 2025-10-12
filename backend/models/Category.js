const mongoose = require('mongoose');

// Basit slug oluşturucu (Türkçe karakter desteği)
const toSlug = (value) => {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    // Türkçe karakterleri sadeleştir
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    // Alfanümerik ve boşluk/dash dışını temizle
    .replace(/[^a-z0-9\s-]/g, '')
    // Boşlukları tire yap
    .replace(/\s+/g, '-')
    // Birden çok tireyi tekille
    .replace(/-+/g, '-')
    // Baş/sondaki tireleri kırp
    .replace(/^-+|-+$/g, '');
};

const categorySchema = new mongoose.Schema({
  // Temel Bilgiler
  name: {
    type: String,
    required: [true, 'Kategori adı gereklidir'],
    trim: true,
    unique: true,
    maxlength: [50, 'Kategori adı 50 karakterden fazla olamaz']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Açıklama 200 karakterden fazla olamaz']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Hiyerarşik Yapı
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0
  },

  // Görsel
  icon: {
    type: String,
    trim: true
  },
  image: {
    url: String,
    alt: String
  },

  // Durum ve Ayarlar
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },

  // SEO
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta başlık 60 karakterden fazla olamaz']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta açıklama 160 karakterden fazla olamaz']
  },
  keywords: [String],

  // İstatistikler
  productCount: {
    type: Number,
    default: 0
  },

  // Tarihler
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual alanlar
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Index'ler
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ sortOrder: 1 });

// Middleware - slug otomatik oluşturma (validate aşamasında)
categorySchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  } else if (this.isModified('name')) {
    this.slug = toSlug(this.name);
  }
  next();
});

// Middleware - level hesaplama
categorySchema.pre('save', async function(next) {
  if (this.isModified('parent')) {
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      this.level = parentCategory ? parentCategory.level + 1 : 0;
    } else {
      this.level = 0;
    }
  }
  next();
});

// Static method - kategori ağacını getir
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ status: 'active' }).sort({ sortOrder: 1, name: 1 });
  
  const buildTree = (categories, parentId = null) => {
    return categories
      .filter(category => category.parent?.toString() === parentId?.toString())
      .map(category => ({
        ...category.toObject(),
        children: buildTree(categories, category._id)
      }));
  };
  
  return buildTree(categories);
};

// Instance method - alt kategorileri say
categorySchema.methods.getProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id, status: 'active' });
  this.productCount = count;
  await this.save();
  return count;
};

// Instance method - tüm alt kategorileri getir
categorySchema.methods.getAllChildren = async function() {
  const children = await this.constructor.find({ parent: this._id });
  let allChildren = [...children];
  
  for (const child of children) {
    const grandChildren = await child.getAllChildren();
    allChildren = allChildren.concat(grandChildren);
  }
  
  return allChildren;
};

module.exports = mongoose.model('Category', categorySchema);
