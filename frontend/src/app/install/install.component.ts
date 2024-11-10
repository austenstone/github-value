import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../material.module';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SetupService } from '../services/setup.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';


@Component({
  selector: 'app-install',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './install.component.html',
  styleUrl: './install.component.scss'
})
export class InstallComponent implements OnInit {

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private setupService: SetupService
  ) { }

  ngOnInit(): void {
    this.checkIfSetup();
  }
  
  checkIfSetup(): void {
    this.setupService.getSetupStatus().subscribe((response) => {
      if (response.isSetup) this.router.navigate(['/']);
    });
  }

  openDialog(existingApp: boolean): void {
    this.dialog.open(DialogAppComponent, {
      width: '400px',
      data: existingApp
    }).afterClosed().subscribe(() => {
      this.checkIfSetup();
    });
  }
}

@Component({
  selector: 'app-dialog-create-app',
  templateUrl: './dialog-create-app.html',
  styleUrl: './dialog-create-app.scss',
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    CommonModule,
    ClipboardModule
  ]
})
export class DialogAppComponent {
  // Manifest Parameters: https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest#github-app-manifest-parameters
   @ViewChild('form') form!: ElementRef<HTMLFormElement>;
  formAction = 'https://github.com/settings/apps/new?state=abc123';
  manifest: {
    name: string;
    url: string;
    hook_attributes: {
      url: string;
    };
    setup_url: string;
    redirect_url: string;
    public: boolean;
    default_permissions: {
      pull_requests: string;
      organization_copilot_seat_management: string;
    };
    default_events: string[];
  } | undefined;
  manifestString: string | undefined;
  organizationFormControl = new FormControl('', []);
  existingApp: boolean;
  existingAppForm = new FormGroup({
    appIdFormControl: new FormControl('', [Validators.required]),
    webhookSecretFormControl: new FormControl('', [Validators.required]),
    privateKeyFormControl: new FormControl('', [Validators.required]),
    privateKey: new FormControl('', [Validators.required])
  });

  constructor(
    public dialogRef: MatDialogRef<DialogAppComponent>,
    @Inject(MAT_DIALOG_DATA) public data: boolean,
    private setupService: SetupService
  ) {
    this.existingApp = data;
    this.setupService.getManifest().subscribe((manifest: any) => {
      this.manifest = manifest;
      this.manifestString = JSON.stringify(manifest);
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  registerNewApp() {
    if (this.organizationFormControl.value) {
      this.form.nativeElement.action = `https://github.com/organizations/${this.organizationFormControl.value}/settings/apps/new?state=abc123`
    }
    this.form.nativeElement.submit();
    this.dialogRef.close();
  }

  addExistingApp() {
    this.existingAppForm.markAllAsTouched();
    if (this.existingAppForm.invalid) {
      return;
    }
    this.setupService.addExistingApp({
      appId: this.existingAppForm.value.appIdFormControl!,
      webhookSecret: this.existingAppForm.value.webhookSecretFormControl!,
      privateKey: this.existingAppForm.value.privateKey!
    }).subscribe(() => {
      this.dialogRef.close();
    });
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      console.error("No file selected or file input is null");
      return;
    }

    const file = fileInput.files[0];

    file.text().then((text) => {
      this.existingAppForm.controls.privateKey.setValue(text);
    });
  }
}