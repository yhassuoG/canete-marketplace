package com.canete.marketplace.modules.catalog.application;

import com.canete.marketplace.modules.catalog.domain.Listing;
import java.util.List;

public interface ListCatalogUseCase {
    List<Listing> execute();
}
