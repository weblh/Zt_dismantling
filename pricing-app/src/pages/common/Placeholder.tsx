export default function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 48, background: '#fff', margin: 16, borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ color: '#666' }}>该模块已归属议价应用，详细功能可继续完善。</p>
    </div>
  );
}
