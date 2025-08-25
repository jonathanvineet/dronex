"use client";

import { useEffect, useState } from "react";

export default function ElizaOSDroneDisplay({ orderId, onDataUpdate }) {
	const [drones, setDrones] = useState([]);
	const [analytics, setAnalytics] = useState(null);
	const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

	useEffect(() => {
		let mounted = true;
		async function fetchData() {
			try {
				const dRes = await fetch(`${backend}/api/drones`);
				if (dRes.ok) {
					const d = await dRes.json();
					if (mounted) setDrones(d.drones || []);
					if (onDataUpdate) onDataUpdate({ drones: d.drones, activeJobs: d.activeJobs });
				}
				const aRes = await fetch(`${backend}/api/hive-analytics`);
				if (aRes.ok) {
					const a = await aRes.json();
					if (mounted) setAnalytics(a);
					if (onDataUpdate) onDataUpdate({ analytics: a });
				}
			} catch (err) {
				// ignore fetch errors for now
			}
		}

		fetchData();
		const iv = setInterval(fetchData, 5000);
		return () => { mounted = false; clearInterval(iv); };
	}, [orderId, onDataUpdate]);

	return (
		<div className="bg-drone-charcoal/30 rounded-lg p-4">
			<h4 className="font-bold text-drone-highlight mb-2">ElizaOS & Hive</h4>
			<p className="text-sm text-gray-300">Order: {orderId}</p>
			<div className="mt-3 text-sm text-gray-300">
				<div>Drones in fleet: {drones.length}</div>
				<div>Active jobs: {analytics?.activeJobs ?? '—'}</div>
				{analytics && (
					<div className="mt-2">
						<div>Average Hive Score: {analytics.averageHiveScore ?? '—'}</div>
						<div>Network Status: {analytics.networkStatus ?? 'connected'}</div>
					</div>
				)}
			</div>
		</div>
	);
}
