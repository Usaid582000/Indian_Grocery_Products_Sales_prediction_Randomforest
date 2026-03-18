import { useMemo } from 'react';

/**
 * Derives dashboard stats from live products + predictions data.
 *
 * @param {Array} products    — from useProducts()
 * @param {Array} predictions — from usePredictions()
 * @returns {Object} stats
 */
export function useDashboardStats(products, predictions) {
  return useMemo(() => {
    // ── Products ────────────────────────────────────────────────
    const totalProducts = products.length;

    // total history entries across all products
    const totalHistoryEntries = products.reduce(
      (sum, p) => sum + (p.historyCount || (p.history || []).length),
      0
    );

    // ── Predictions ─────────────────────────────────────────────
    const totalPredictions = predictions.length;

    const withActuals = predictions.filter(
      (p) => p.accuracy !== null && p.accuracy !== undefined
    );

    const avgAccuracy =
      withActuals.length > 0
        ? Math.round(
            (withActuals.reduce((s, p) => s + Number(p.accuracy), 0) /
              withActuals.length) *
              10
          ) / 10
        : null;

    // ── Last prediction ─────────────────────────────────────────
    const lastPrediction = predictions[0] || null;

    // ── Top 5 products by latest sales value ───────────────────
    const topProducts = products
      .map((p) => {
        const history  = p.history || [];
        const latest   = history.reduce((best, h) => {
          if (!best) return h;
          return new Date(h.orderDate) > new Date(best.orderDate) ? h : best;
        }, null);
        return { ...p, latestSales: latest ? Number(latest.sales) : 0 };
      })
      .sort((a, b) => b.latestSales - a.latestSales)
      .slice(0, 5);

    // ── Recent sales trend (last 30 days across all products) ───
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // aggregate daily sales across all products
    const dailyMap = {};
    products.forEach((p) => {
      (p.history || []).forEach((h) => {
        const d = h.orderDate;
        if (!d) return;
        const date = new Date(d);
        if (date < thirtyDaysAgo) return;
        dailyMap[d] = (dailyMap[d] || 0) + Number(h.sales || 0);
      });
    });

    const salesTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, sales]) => ({
        date,
        sales,
        label: new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short',
        }),
      }));

    // ── Accuracy over time (for chart) ──────────────────────────
    const accuracyTrend = [...predictions]
      .filter((p) => p.accuracy !== null && p.predictionDate)
      .sort((a, b) => new Date(a.predictionDate) - new Date(b.predictionDate))
      .map((p) => ({
        date:     p.predictionDate,
        accuracy: Number(p.accuracy),
        label:    new Date(p.predictionDate).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short',
        }),
        productName: p.productName,
      }));

    return {
      totalProducts,
      totalHistoryEntries,
      totalPredictions,
      avgAccuracy,
      lastPrediction,
      topProducts,
      salesTrend,
      accuracyTrend,
    };
  }, [products, predictions]);
}