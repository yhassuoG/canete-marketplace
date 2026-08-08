package com.canete.marketplace.modules.catalog.application;

import com.canete.marketplace.modules.catalog.domain.Listing;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CatalogService implements ListCatalogUseCase {

    @Override
    public List<Listing> execute() {
        return List.of(
            new Listing("1", "muelle-pacifico", "Muelle Pacifico", "restaurant", "San Vicente", 4.9, true, true),
            new Listing("2", "paraiso-lunahuana", "Paraiso Lunahuana", "hotel", "Lunahuana", 4.8, true, false),
            new Listing("3", "vina-del-sol", "Vina del Sol", "experience", "Nuevo Imperial", 4.7, true, false)
        );
    }
}
