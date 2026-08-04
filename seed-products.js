const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Menghapus data produk lama...');
  await prisma.product.deleteMany();

  console.log('Memasukkan data produk baru...');
  const products = [
    {
      name: 'Udang Vaname Super',
      category: 'udang',
      imageUrl: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Udang vaname segar kualitas super, langsung dari tambak pilihan.',
      unit: 'kg',
      price: 85000,
      stock: 150
    },
    {
      name: 'Udang Windu Besar',
      category: 'udang',
      imageUrl: 'https://images.unsplash.com/photo-1559742811-822873691df8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Udang windu ukuran besar yang cocok untuk dibakar atau digoreng.',
      unit: 'kg',
      price: 125000,
      stock: 45
    },
    {
      name: 'Ikan Nila Merah',
      category: 'ikan',
      imageUrl: 'https://images.unsplash.com/photo-1580479708688-662580a56eb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Ikan nila merah segar dan sehat dari kolam air tawar alami.',
      unit: 'kg',
      price: 35000,
      stock: 80
    },
    {
      name: 'Ikan Gurame Segar',
      category: 'ikan',
      imageUrl: 'https://images.unsplash.com/photo-1534937213217-1f4a9b517e47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Ikan gurame berdaging tebal, sangat nikmat disajikan asam manis.',
      unit: 'kg',
      price: 55000,
      stock: 25
    },
    {
      name: 'Udang Ronggeng',
      category: 'udang',
      imageUrl: 'https://images.unsplash.com/photo-1596707248383-7c98cbf12833?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Udang ronggeng segar tangkapan laut dengan cita rasa unik.',
      unit: 'kg',
      price: 95000,
      stock: 30
    },
    {
      name: 'Ikan Kerapu Macan',
      category: 'ikan',
      imageUrl: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Ikan kerapu macan premium standar restoran bintang 5.',
      unit: 'kg',
      price: 140000,
      stock: 15
    },
    {
      name: 'Ikan Lele Sangkuriang',
      category: 'ikan',
      imageUrl: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Ikan lele siap konsumsi hasil budidaya bersih.',
      unit: 'kg',
      price: 25000,
      stock: 200
    },
    {
      name: 'Udang Galah',
      category: 'udang',
      imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Udang galah air tawar ukuran jumbo.',
      unit: 'kg',
      price: 160000,
      stock: 10
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }

  console.log('Berhasil menambahkan 8 produk ke database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
