import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

// ─── API helpers ────────────────────────────────────────────────────────────

const recipesApi = {
  getAll: () => client.get("/recipes/"),
  create: (data) => client.post("/recipes/", data),
  delete: (id) => client.delete(`/recipes/${id}`),
  addIngredient: (recipeId, data) => client.post(`/recipes/${recipeId}/ingredients`, data),
  removeIngredient: (recipeId, ingredientId) => client.delete(`/recipes/${recipeId}/ingredients/${ingredientId}`),
};

const foodsApi = {
  search: (q) => client.get(`/foods/search?q=${encodeURIComponent(q)}`),
};

// ─── NavBar ──────────────────────────────────────────────────────────────────

function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/diary", label: "Diary" },
    { to: "/exercise", label: "Exercise" },
    { to: "/recipes", label: "Recipes" },
    { to: "/progress", label: "Progress" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        <Link to="/dashboard" style={styles.navLogo}>
          <span>⚡</span>
          <span>Calorimatic</span>
        </Link>
        <div style={styles.navLinks}>
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                ...styles.navLink,
                ...(to === "/recipes" ? styles.navLinkActive : {}),
              }}
            >
              {label}
            </Link>
          ))}
          <button onClick={handleLogout} style={styles.navLogout}>Log out</button>
        </div>
      </div>
    </nav>
  );
}

// ─── Create Recipe Modal ──────────────────────────────────────────────────────

function CreateRecipeModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "", servings: 1, source_url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Recipe name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onCreate({
        name: form.name.trim(),
        description: form.description || null,
        servings: parseInt(form.servings) || 1,
        source_url: form.source_url || null,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to create recipe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>New Recipe</div>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <label style={styles.label}>Recipe name *</label>
        <input
          style={styles.input}
          placeholder="e.g. Chicken Stir Fry"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          autoFocus
        />

        <label style={styles.label}>Description</label>
        <input
          style={styles.input}
          placeholder="Optional short description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />

        <label style={styles.label}>Servings</label>
        <input
          style={styles.input}
          type="number"
          min="1"
          value={form.servings}
          onChange={(e) => setForm((f) => ({ ...f, servings: e.target.value }))}
        />

        <label style={styles.label}>Source URL (optional)</label>
        <input
          style={styles.input}
          placeholder="https://..."
          value={form.source_url}
          onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
        />

        {error && <div style={styles.errorMsg}>{error}</div>}

        <div style={styles.modalActions}>
          <button style={styles.backBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating…" : "Create Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Detail Modal ──────────────────────────────────────────────────────

function RecipeDetailModal({ recipe, onClose, onDelete, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await foodsApi.search(searchQuery);
      setSearchResults(res.data?.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!selectedFood) return;
    setAdding(true);
    setError("");
    try {
      await recipesApi.addIngredient(recipe.id, {
        food_id: selectedFood.id,
        quantity: parseFloat(quantity),
      });
      setSelectedFood(null);
      setSearchQuery("");
      setSearchResults([]);
      setQuantity(1);
      await onRefresh();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to add ingredient.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      await recipesApi.removeIngredient(recipe.id, ingredientId);
      await onRefresh();
    } catch {
      setError("Failed to remove ingredient.");
    }
  };

  const macros = [
    { label: "Calories", value: recipe.calories_per_serving?.toFixed(0), unit: "kcal", color: "#22c55e" },
    { label: "Protein", value: recipe.protein_per_serving?.toFixed(1), unit: "g", color: "#3b82f6" },
    { label: "Carbs", value: recipe.carbs_per_serving?.toFixed(1), unit: "g", color: "#f59e0b" },
    { label: "Fat", value: recipe.fat_per_serving?.toFixed(1), unit: "g", color: "#ef4444" },
  ];

  return (
    <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...styles.modal, maxWidth: 640 }}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>{recipe.name}</div>
            {recipe.description && <div style={styles.modalSubtitle}>{recipe.description}</div>}
          </div>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Macro summary */}
        <div style={styles.macroRow}>
          {macros.map((m) => (
            <div key={m.label} style={styles.macroCard}>
              <div style={{ ...styles.macroValue, color: m.color }}>
                {m.value ?? "—"}{m.value && <span style={styles.macroUnit}>{m.unit}</span>}
              </div>
              <div style={styles.macroLabel}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={styles.servingsNote}>Per serving · {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""} total</div>

        {/* Ingredients list */}
        <div style={styles.ingredientsSection}>
          <h3 style={styles.sectionTitle}>Ingredients ({recipe.ingredients?.length || 0})</h3>
          {recipe.ingredients?.length === 0 ? (
            <p style={styles.emptyText}>No ingredients yet. Add some below.</p>
          ) : (
            <div style={styles.ingredientList}>
              {recipe.ingredients?.map((ing) => (
                <div key={ing.id} style={styles.ingredientItem}>
                  <div style={styles.ingredientInfo}>
                    <span style={styles.ingredientName}>Food ID: {ing.food_id}</span>
                    <span style={styles.ingredientQty}>×{ing.quantity}</span>
                  </div>
                  <button style={styles.removeBtn} onClick={() => handleRemoveIngredient(ing.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add ingredient */}
        <div style={styles.addIngredientSection}>
          <h3 style={styles.sectionTitle}>Add Ingredient</h3>
          <form onSubmit={handleSearch} style={styles.searchRow}>
            <input
              style={{ ...styles.input, margin: 0, flex: 1 }}
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button style={styles.searchBtn} type="submit">
              {searching ? "…" : "🔍"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div style={styles.searchResults}>
              {searchResults.map((food) => (
                <div
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  style={{
                    ...styles.searchResultItem,
                    border: selectedFood?.id === food.id ? "1px solid #22c55e" : "1px solid #334155",
                  }}
                >
                  <div>
                    <div style={styles.foodName}>{food.name}</div>
                    <div style={styles.foodMeta}>{food.calories_per100} kcal · {food.protein_per100}g P per 100g</div>
                  </div>
                  {selectedFood?.id === food.id && <span style={{ color: "#22c55e" }}>✓</span>}
                </div>
              ))}
            </div>
          )}

          {selectedFood && (
            <div style={styles.selectedFoodRow}>
              <span style={styles.selectedFoodName}>{selectedFood.name}</span>
              <div style={styles.quantityRow}>
                <label style={styles.quantityLabel}>Qty (×100g)</label>
                <input
                  style={{ ...styles.input, width: 80, margin: 0 }}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <button style={styles.addIngredientBtn} onClick={handleAddIngredient} disabled={adding}>
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          )}

          {error && <div style={styles.errorMsg}>{error}</div>}
        </div>

        {/* Delete recipe */}
        <div style={styles.dangerZone}>
          {confirming ? (
            <div style={styles.confirmRow}>
              <span style={styles.confirmText}>Delete this recipe?</span>
              <button style={styles.confirmYes} onClick={() => onDelete(recipe.id)}>Yes, delete</button>
              <button style={styles.confirmNo} onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          ) : (
            <button style={styles.deleteRecipeBtn} onClick={() => setConfirming(true)}>
              🗑 Delete Recipe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onClick }) {
  const hasNutrition = recipe.calories_per_serving != null;

  return (
    <div style={styles.recipeCard} onClick={onClick}>
      <div style={styles.recipeCardHeader}>
        <div style={styles.recipeEmoji}>🍽️</div>
        <div style={styles.recipeCardInfo}>
          <div style={styles.recipeCardName}>{recipe.name}</div>
          {recipe.description && (
            <div style={styles.recipeCardDesc}>{recipe.description}</div>
          )}
        </div>
      </div>

      <div style={styles.recipeCardMeta}>
        <span style={styles.recipeServings}>🍴 {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}</span>
        {recipe.source_url && <span style={styles.recipeSource}>🔗 Has source</span>}
        <span style={styles.recipeIngCount}>{recipe.ingredients?.length || 0} ingredients</span>
      </div>

      {hasNutrition && (
        <div style={styles.recipeCardNutrition}>
          <span style={{ color: "#22c55e" }}>{recipe.calories_per_serving?.toFixed(0)} kcal</span>
          <span style={{ color: "#3b82f6" }}>{recipe.protein_per_serving?.toFixed(1)}g P</span>
          <span style={{ color: "#f59e0b" }}>{recipe.carbs_per_serving?.toFixed(1)}g C</span>
          <span style={{ color: "#ef4444" }}>{recipe.fat_per_serving?.toFixed(1)}g F</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recipesApi.getAll();
      setRecipes(res.data || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleCreate = async (data) => {
    await recipesApi.create(data);
    await fetchRecipes();
    showToast("Recipe created! 🍽️");
  };

  const handleDelete = async (id) => {
    try {
      await recipesApi.delete(id);
      setSelectedRecipe(null);
      await fetchRecipes();
      showToast("Recipe deleted.");
    } catch {
      showToast("Could not delete recipe.", "error");
    }
  };

  const handleRefresh = async () => {
    await fetchRecipes();
    if (selectedRecipe) {
      const res = await recipesApi.getAll();
      const updated = res.data?.find((r) => r.id === selectedRecipe.id);
      if (updated) setSelectedRecipe(updated);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={styles.page}>
      <NavBar />

      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#7f1d1d" : "#14532d", borderColor: toast.type === "error" ? "#ef444466" : "#22c55e66" }}>
          {toast.msg}
        </div>
      )}

      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>🍽️ Recipes</h1>
            <p style={styles.pageSubtitle}>Build and track your favourite meals</p>
          </div>
          <button style={styles.addBtn} onClick={() => setShowCreateModal(true)}>
            + New Recipe
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <div style={styles.spinner} />
            <p style={styles.emptyText}>Loading recipes…</p>
          </div>
        ) : recipes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🍳</div>
            <p style={styles.emptyTitle}>No recipes yet</p>
            <p style={styles.emptyText}>Create your first recipe to track its nutrition and log it quickly from the diary.</p>
            <button style={styles.emptyAddBtn} onClick={() => setShowCreateModal(true)}>
              + Create your first recipe
            </button>
          </div>
        ) : (
          <>
            <div style={styles.recipesGrid}>
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipe(recipe)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {showCreateModal && (
        <CreateRecipeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: { minHeight: "100vh", background: "#0f172a", color: "#e8e8f0", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" },

  nav: { borderBottom: "1px solid #1e293b", background: "#0f172a", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLogo: { display: "flex", alignItems: "center", gap: 8, color: "#e8e8f0", textDecoration: "none", fontWeight: 700, fontSize: 18 },
  navLinks: { display: "flex", alignItems: "center", gap: 4 },
  navLink: { color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 12px", borderRadius: 8 },
  navLinkActive: { color: "#22c55e", background: "rgba(34,197,94,0.1)" },
  navLogout: { background: "none", border: "1px solid #334155", color: "#94a3b8", fontSize: 13, padding: "6px 12px", borderRadius: 8, cursor: "pointer", marginLeft: 8 },

  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", border: "1px solid", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 500, zIndex: 9999, pointerEvents: "none", whiteSpace: "nowrap" },

  main: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 4px" },
  pageSubtitle: { color: "#64748b", fontSize: 14, margin: 0 },
  addBtn: { background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" },

  recipesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },

  recipeCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: 20, cursor: "pointer", transition: "border-color 0.15s" },
  recipeCardHeader: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  recipeEmoji: { fontSize: 28, flexShrink: 0 },
  recipeCardInfo: { flex: 1, minWidth: 0 },
  recipeCardName: { fontWeight: 700, fontSize: 16, color: "#e2e8f0", marginBottom: 4 },
  recipeCardDesc: { fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  recipeCardMeta: { display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" },
  recipeServings: { fontSize: 12, color: "#64748b" },
  recipeSource: { fontSize: 12, color: "#64748b" },
  recipeIngCount: { fontSize: 12, color: "#64748b" },
  recipeCardNutrition: { display: "flex", gap: 12, paddingTop: 10, borderTop: "1px solid #334155", fontSize: 13, fontWeight: 600 },

  emptyState: { textAlign: "center", padding: "64px 24px", background: "#1e293b", borderRadius: 16, border: "1px solid #334155" },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b", maxWidth: 360, margin: "0 auto 24px" },
  emptyAddBtn: { background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  spinner: { width: 28, height: 28, border: "3px solid rgba(34,197,94,0.2)", borderTop: "3px solid #22c55e", borderRadius: "50%", margin: "0 auto 12px" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#1e293b", border: "1px solid #334155", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#e2e8f0" },
  modalSubtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  modalClose: { background: "rgba(255,255,255,0.08)", border: "none", color: "#888", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14, flexShrink: 0 },
  modalActions: { display: "flex", gap: 10, marginTop: 24 },

  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6, marginTop: 16 },
  input: { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" },
  errorMsg: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 },
  backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#aaa", borderRadius: 10, padding: "12px 16px", fontSize: 14, cursor: "pointer", fontWeight: 500 },
  saveBtn: { flex: 1, background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" },

  macroRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 6 },
  macroCard: { background: "#0f172a", borderRadius: 10, padding: "12px 8px", textAlign: "center" },
  macroValue: { fontSize: 18, fontWeight: 700 },
  macroUnit: { fontSize: 11, fontWeight: 500 },
  macroLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  servingsNote: { fontSize: 12, color: "#64748b", marginBottom: 20 },

  ingredientsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: "#e2e8f0", margin: "0 0 12px" },
  ingredientList: { display: "flex", flexDirection: "column", gap: 6 },
  ingredientItem: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a", borderRadius: 8, padding: "10px 14px", border: "1px solid #334155" },
  ingredientInfo: { display: "flex", gap: 10, alignItems: "center" },
  ingredientName: { fontSize: 14, color: "#e2e8f0" },
  ingredientQty: { fontSize: 12, color: "#64748b" },
  removeBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: "2px 6px" },

  addIngredientSection: { borderTop: "1px solid #334155", paddingTop: 20, marginBottom: 20 },
  searchRow: { display: "flex", gap: 8, marginBottom: 10 },
  searchBtn: { background: "#22c55e", border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", fontSize: 16 },
  searchResults: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", marginBottom: 10 },
  searchResultItem: { background: "#0f172a", borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  foodName: { fontSize: 14, color: "#e2e8f0", marginBottom: 2 },
  foodMeta: { fontSize: 12, color: "#64748b" },
  selectedFoodRow: { background: "#0f172a", borderRadius: 10, padding: 14, border: "1px solid #22c55e" },
  selectedFoodName: { fontSize: 14, fontWeight: 600, color: "#22c55e", display: "block", marginBottom: 10 },
  quantityRow: { display: "flex", alignItems: "center", gap: 10 },
  quantityLabel: { fontSize: 13, color: "#94a3b8" },
  addIngredientBtn: { background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" },

  dangerZone: { borderTop: "1px solid #334155", paddingTop: 16 },
  deleteRecipeBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer", fontWeight: 500 },
  confirmRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  confirmText: { fontSize: 14, color: "#94a3b8", flex: 1 },
  confirmYes: { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  confirmNo: { background: "rgba(255,255,255,0.06)", border: "1px solid #334155", color: "#aaa", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
};