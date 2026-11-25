/**
 * Vite 配置
 * 入口：编辑器与独立教程页
 */
export default {
  base: "./",
  build: {
    rollupOptions: { input: ["index.html", "tutorial.html"] },
  },
  server: { port: 5196 },
};
