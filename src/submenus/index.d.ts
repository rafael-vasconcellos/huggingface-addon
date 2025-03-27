interface ContextMenuItem { 
    name: string,
	callback?: CallableFunction
	submenu?: { 
		items: (ContextMenuItem & { 
            key: string 
        })[]
	}
}