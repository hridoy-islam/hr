import { Link } from "react-router-dom"
export function StatCard({ title, value, href }) {
  return (
    <Link to={href}>
      <div className={`rounded-lg bg-white p-6 shadow-sm`}>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </div>
    </Link>
  )
}

