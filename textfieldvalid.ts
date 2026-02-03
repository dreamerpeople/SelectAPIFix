//html
<mat-form-field class="grid-item" appearance="outline">
                      <mat-label>{{ column.displayName }}</mat-label>
                      <input
                        matInput
                        class="editable-input"
                        [formControlName]="column.columnName"
                        [attr.data-column]="column.columnName"
                        [attr.name]="column.columnName"
                        (input)="updateInputData($event, column.columnName)"
                        (blur)="updateInputData($event, column.columnName, true)"
                      />
                      <button
                        mat-icon-button
                        matSuffix
                        (click)="
                          removeColumnName(column.columnName, selectStatus)
                        "
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                      <mat-error
                        *ngIf="
                          form.controls[column.columnName].hasError(
                            'required'
                          ) && form.get(column.columnName)?.touched
                        "
                      >
                        {{ column.displayName }} is required.
                      </mat-error>
                      <mat-hint *ngIf="inputHint[column.columnName]" class="error-hint">
                        {{ inputHint[column.columnName] }}
                      </mat-hint>
                    </mat-form-field>
//css
.error-hint {
  color: #d32f2f; // material red
  font-size: 12px;
}
//code
  inputHint: { [key: string]: string } = {};
  updateInputData(
    event: Event,
    columnName: string,
    finalize: boolean = false,
  ): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    let value = el.value;

    // reset hint
    this.inputHint[columnName] = '';

    if (/^\s/.test(value)) {
      this.inputHint[columnName] = 'Text cannot start with a space';
    }

    const specialCharRegex = /[#,%?<>\/\\^]/;
    if (specialCharRegex.test(value)) {
      this.inputHint[columnName] = 'Special characters are not allowed';
    }

    // remove special characters
    value = value.replace(/[#,%?<>\/\\^]/g, '');

    if (el instanceof HTMLTextAreaElement) {
      value = value.replace(/^[ \t]+/gm, '');
      value = value.replace(/[ \t]+$/gm, '');
      value = value.replace(/[ \t]{2,}/g, ' ');
    } else {
      value = value.replace(/\s{2,}/g, ' ');
      if (finalize) {
        value = value.trim();
      }
    }

    el.value = value;
    this.form[columnName] = value;
  }