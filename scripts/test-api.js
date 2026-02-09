/**
 * API Routes Testing Script
 * Tests signup, login, cart, and wishlist endpoints
 */

const API_BASE = "http://localhost:3001";

async function testSignUp() {
  console.log("\n📝 Testing Signup...");
  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "TestPassword123!",
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", data);
    return data.user?.id;
  } catch (error) {
    console.error("Signup error:", error);
  }
}

async function testLogin() {
  console.log("\n🔐 Testing Login...");
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPassword123!",
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", data);
    return data.user?.id;
  } catch (error) {
    console.error("Login error:", error);
  }
}

async function testGetUser(userId) {
  console.log("\n👤 Testing Get User...");
  try {
    const response = await fetch(`${API_BASE}/api/users/${userId}`);

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", data);
  } catch (error) {
    console.error("Get user error:", error);
  }
}

async function testCart() {
  console.log("\n🛒 Testing Cart API...");
  try {
    // Get cart
    const getResponse = await fetch(
      `${API_BASE}/api/cart?email=test@example.com`,
    );
    console.log(`GET Cart Status: ${getResponse.status}`);

    // Add item to cart
    const postResponse = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        items: [
          {
            id: "product-1",
            name: "Test Product",
            price: 99.99,
            quantity: 1,
          },
        ],
      }),
    });

    const data = await postResponse.json();
    console.log(`POST Cart Status: ${postResponse.status}`);
    console.log("Response:", data);
  } catch (error) {
    console.error("Cart error:", error);
  }
}

async function testWishlist() {
  console.log("\n❤️ Testing Wishlist API...");
  try {
    // Get wishlist
    const getResponse = await fetch(
      `${API_BASE}/api/wishlist?email=test@example.com`,
    );
    console.log(`GET Wishlist Status: ${getResponse.status}`);

    // Add item to wishlist
    const postResponse = await fetch(`${API_BASE}/api/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        items: [
          {
            id: "product-1",
            name: "Test Product",
            price: 99.99,
          },
        ],
      }),
    });

    const data = await postResponse.json();
    console.log(`POST Wishlist Status: ${postResponse.status}`);
    console.log("Response:", data);
  } catch (error) {
    console.error("Wishlist error:", error);
  }
}

async function runTests() {
  console.log("🚀 Starting API Route Tests...");
  console.log(`API Base: ${API_BASE}`);
  console.log("=".repeat(50));

  await testSignUp();
  await testLogin();
  // await testGetUser(userId); // Uncomment if you have a user ID
  await testCart();
  await testWishlist();

  console.log("\n" + "=".repeat(50));
  console.log("✅ Tests completed!");
}

runTests();
