<script>
  import './styles/app.css';
  import '../../public/css/styles.css'; // Ensure styles.css is loaded
</script>

<div class="app-container">
  <header class="app-header">
    <div class="container flex justify-between items-center">
      <h1 class="text-xl font-bold">Markdowner</h1>
      <nav>
        <!-- Navigation links -->
        <a href="/" class="mr-4 hover:text-primary">Home</a>
        <a href="/about" class="hover:text-primary">About</a>
      </nav>
    </div>
  </header>
  
  <main class="container py-8">
    <!-- Main content -->
    <!-- ...existing code... -->
  </main>
  
  <footer class="bg-gray-100 py-6 mt-auto">
    <div class="container text-center text-gray-600">
      &copy; 2025 Markdowner. All rights reserved.
    </div>
  </footer>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
</style>
