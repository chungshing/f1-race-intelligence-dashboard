export async function getStandings() {
    const res = await fetch("http://localhost:8080/api/standings");

    if (!res.ok) {
        throw new Error("Failed to fetch standings");
    }

    return res.json();
}
