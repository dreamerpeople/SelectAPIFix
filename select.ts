//html
 <mat-form-field appearance="outline" class="type-field">
    <mat-label>Type</mat-label>
    <mat-select
    #selectElementType
    formControlName="type"
    (openedChange)="
        onSelectOpened(
        $event,
        searchInputType,
        'type',
        selectElementType
        )
    "
    (selectionChange)="
        updateSelectionData(
        searchableColumns[1],
        $event,
        searchInputType,
        selectElementType
        )
    "
    >
    <input
        matInput
        #searchInputType
        placeholder="Search Type"
        (input)="
        filterSearchableItems($event, 'type', 'autocomplete')
        "
        (click)="$event.stopPropagation()"
        class="custom-input"
    />

    <mat-option
        *ngFor="let option of formColumn['type']"
        [value]="option"
    >
        {{ option }}
    </mat-option>
    </mat-select>
    </mat-form-field>
//css
    // Styling for searchable select input
    .custom-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    background: white;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #3f51b5;
        box-shadow: 0 0 0 2px rgba(63, 81, 181, 0.1);
        background: white;
    }

    &::placeholder {
        color: #9e9e9e;
    }
    }
//code
  private destroy$ = new Subject<void>();




ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.loadTypeOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load categories from API
   */
  loadCategories(): void {
    this.datasourceService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categoryOptions = categories;
          // Initialize searchable form columns with category options
          this.formColumn['category'] = categories;
          this.originalFormColumn['category'] = [...categories];
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        },
      });
  }

  /**
   * Load all type options from API
   */
  loadTypeOptions(): void {
    this.datasourceService
      .getAllTypeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (typeOptions) => {
          this.typeOptions = typeOptions;
          // Initialize searchable form columns with category options
          this.formColumn['category'] = this.categoryOptions;
          this.originalFormColumn['category'] = [...this.categoryOptions];
        },
        error: (error) => {
          console.error('Error loading type options:', error);
        },
      });
  }

  /**
   * Handle select opened event for searchable selects
   */
  onSelectOpened(
    event: boolean,
    searchInput: HTMLInputElement,
    columnName: string,
    selectElement: any,
  ): void {
    if (event) {
      // Focus search input when select opens
      setTimeout(() => {
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }

  /**
   * Filter searchable items based on input
   */
  filterSearchableItems(
    event: Event,
    columnName: string,
    type: string = 'autocomplete',
  ): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();

    if (!this.originalFormColumn[columnName]) {
      this.originalFormColumn[columnName] = [
        ...(this.formColumn[columnName] || []),
      ];
    }

    if (searchValue.trim() === '') {
      // Reset to original options if search is empty
      this.formColumn[columnName] = [...this.originalFormColumn[columnName]];
    } else {
      // Filter options based on search input
      this.formColumn[columnName] = this.originalFormColumn[columnName].filter(
        (option) => option.toLowerCase().includes(searchValue),
      );
    }
  }

  /**
   * Update selection data when option is selected from searchable select
   */
  updateSelectionData(
    column: any,
    event: any,
    searchInput: HTMLInputElement,
    selectElement: any,
  ): void {
    const selectedValue = event.value;
    console.log(`Selected ${column.columnName}:`, selectedValue);

    // Clear search input
    if (searchInput) {
      searchInput.value = '';
    }

    // Reset filter to show all options
    this.formColumn[column.columnName] = [
      ...this.originalFormColumn[column.columnName],
    ];

    // Handle dependent field updates
    if (column.columnName === 'category') {
      // Update type options based on selected category
      const categoryObj = this.typeOptions.find(
        (c) => c.category === selectedValue,
      );
      if (categoryObj) {
        this.formColumn['type'] = categoryObj.types;
        this.originalFormColumn['type'] = [...categoryObj.types];
      }

      // Reset type field if category changes
      const form = this.criteriaForm.get('criteriaRows') as FormArray;
      if (form) {
        form.controls.forEach((row) => {
          row.get('type')?.reset();
        });
      }
    }
  }
  searchData(): void {
    const payload = {
      criteria: this.criteriaForm.get('criteriaRows')?.value,
    };
    console.log('Search payload:', payload);

    // Call API with payload
    this.datasourceService
      .searchData(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.searchDataSource.data = results;
          this.selectedRows.clear();
          this.allSelected = false;
        },
        error: (error) => {
          console.error('Error searching data:', error);
        },
      });
  }
submitSelectedData(): void {
    const selectedData = this.searchDataSource.data.filter((row) =>
      this.selectedRows.has(row.alertId),
    );
    console.log('Submitting data:', selectedData);

    // Call API to upload
    this.datasourceService
      .uploadData(selectedData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Upload response:', response);
          // Add to uploaded data
          if (selectedData.length > 0) {
            this.uploadedDataSource.data = [
              ...this.uploadedDataSource.data,
              ...selectedData.map((d) => ({
                ...d,
                id: Math.random().toString(36).substring(7),
                uploadDate: new Date().toLocaleDateString(),
              })),
            ];
            this.searchDataSource.data = [];
            this.selectedRows.clear();
            this.allSelected = false;
          }
        },
        error: (error) => {
          console.error('Error uploading data:', error);
        },
      });
  }
//service code
  getCategories(): Observable<string[]> {
    // Simulate API call with delay
    return of(this.mockCategories).pipe(delay(300));
  }

  /**
   * Get type options for a specific category
   */
  getTypesByCategory(category: string): Observable<string[]> {
    const categoryObj = this.mockTypeOptions.find(
      (c) => c.category === category,
    );
    const types = categoryObj ? categoryObj.types : [];
    // Simulate API call with delay
    return of(types).pipe(delay(300));
  }

  /**
   * Get all type options mapping
   */
  getAllTypeOptions(): Observable<CategoryType[]> {
    // Simulate API call with delay
    return of(this.mockTypeOptions).pipe(delay(300));
  }

  /**
   * Search data based on criteria
   */
  searchData(criteria: any): Observable<SearchResult[]> {
    // Simulate filtering based on criteria
    let results = [...this.mockSearchResults];

    if (criteria && criteria.criteriaRows && criteria.criteriaRows.length > 0) {
      const firstRow = criteria.criteriaRows[0];
      if (firstRow.category) {
        results = results.filter((r) => r.category === firstRow.category);
      }
    }

    // Simulate API call with delay
    return of(results).pipe(delay(500));
  }

  /**
   * Upload selected data
   */
  uploadData(
    selectedData: SearchResult[],
  ): Observable<{ success: boolean; message: string }> {
    // Simulate API call with delay
    return of({
      success: true,
      message: `Successfully uploaded ${selectedData.length} records`,
    }).pipe(delay(400));
  }