export const parseNeighborhoodIntoRegion = (
	neighborhood: string[] | string
): string | null => {
	if (Array.isArray(neighborhood)) {
		return parseNeighborhoodIntoRegion(neighborhood[0]);
	}
	switch (neighborhood) {
		case "quincy":
			return "boston";
		case "atlave":
			return "boston";
		case "caa":
			return "concord";
		case "cab":
			return "concord";
		case "cdt":
			return "concord";
	}
	return null;
};
