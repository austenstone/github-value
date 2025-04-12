import { Component, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ensure CommonModule is imported
import { RouterModule } from '@angular/router'; // Import RouterModule
import { ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms'; // Import AbstractControl and ValidationErrors
import { FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { CopilotSurveyService, Survey } from '../../../../services/api/copilot-survey.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MembersService, Member } from '../../../../services/api/members.service';
import { InstallationsService } from '../../../../services/api/installations.service';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subject, startWith, take } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'; // Updated import
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Import MatProgressSpinnerModule
import { MatRadioModule } from '@angular/material/radio'; // Import MatRadioModule
import { MatCardModule } from '@angular/material/card'; // Import MatCardModule
import { MatSliderModule } from '@angular/material/slider'; // Import MatSliderModule
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';

export function userIdValidator(membersService: MembersService) {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    // Extract the login string if the value is a Member object, otherwise use the string directly
    const loginToValidate = (typeof value === 'object' && value?.login) ? value.login : value;

    // Ensure we have a non-empty string to validate
    if (typeof loginToValidate !== 'string' || loginToValidate.trim() === '') {
      // Return null if empty or not a string, let 'required' validator handle emptiness
      return of(null);
    }

    return membersService.getMemberByLogin(loginToValidate, true).pipe( // Use exact=true for final validation
      map(member => (member ? null : { invalidUserId: true })),
      catchError(() => of({ invalidUserId: true })) // Assume error means invalid
    );
  };
}

@Component({
  selector: 'app-copilot-survey',
  standalone: true,
  imports: [
    CommonModule, // Use CommonModule instead of BrowserModule
    RouterModule, // Add RouterModule to enable routerLink
    ReactiveFormsModule, // Add ReactiveFormsModule to enable formGroup
    MatTooltipModule,
    MatIconModule, // Add MatIconModule to enable mat-icon
    MatFormFieldModule, // Add MatFormFieldModule to enable mat-form-field
    MatInputModule, // Add MatInputModule to enable matInput
    MatAutocompleteModule, // Add MatAutocompleteModule to enable matAutocomplete
    MatProgressSpinnerModule, // Add MatProgressSpinnerModule to enable mat-spinner
    MatRadioModule, // Add MatRadioModule to enable mat-radio-button
    MatCardModule, // Add MatCardModule to enable mat-card
    MatSliderModule // Add MatSliderModule to enable mat-slider
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NewCopilotSurveyComponent),
      multi: true,
    }
  ],
  templateUrl: './new-copilot-survey.component.html',
  styleUrls: ['./new-copilot-survey.component.scss']
})
export class NewCopilotSurveyComponent implements OnInit {
  surveyForm: FormGroup;
  params: Params = {};
  defaultPercentTimeSaved = 25;
  id: number;
  surveys: Survey[] = [];
  orgFromApp: string = '';
  hasQueryParams = false;
  
  // Use a subject to trigger searches
  private searchTerms = new Subject<string>();
  // Use BehaviorSubject for loading state
  isLoading$ = new BehaviorSubject<boolean>(false);
  // Results observable
  filteredMembers$: Observable<Member[]>;

  constructor(
    private fb: FormBuilder,
    private copilotSurveyService: CopilotSurveyService,
    private route: ActivatedRoute,
    private router: Router,
    private membersService: MembersService,
    private installationsService: InstallationsService
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.id = isNaN(id) ? 0 : id;
    this.surveyForm = this.fb.group({
      userId: new FormControl('', {
        validators: Validators.required, // Keep only the required validator
      }),
      repo: new FormControl(''),
      prNumber: new FormControl(''),
      usedCopilot: new FormControl(true, Validators.required),
      percentTimeSaved: new FormControl(this.defaultPercentTimeSaved, Validators.required),
      reason: new FormControl(''),
      timeUsedFor: new FormControl('', Validators.required)
    });
    
    // Set up the search pipeline
    this.filteredMembers$ = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (term.length < 2) {
          return of([]);
        }
        
        this.isLoading$.next(true);
        return this.membersService.searchMembersByLogin(term).pipe(
          catchError(error => {
            console.error('Error searching members:', error);
            return of([]);
          }),
          map(members => {
            this.isLoading$.next(false);
            return members;
          })
        );
      })
    );
  }

  ngOnInit() {
    // Set up form event listeners
    this.surveyForm.get('userId')?.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        this.searchTerms.next(value);
      }
    });
    
    // Initial form setup from query params
    this.route.queryParams.subscribe(params => {
      this.params = params;
      
      // Set hasQueryParams BEFORE setting values to avoid form validation errors
      this.hasQueryParams = !!(params['author'] || params['repo'] || params['prno'] || params['url']);
      
      // Pre-fill the form only if params exist
      if (params['author']) {
        this.surveyForm.get('userId')?.setValue(params['author']);
      }
      
      if (params['repo']) {
        this.surveyForm.get('repo')?.setValue(params['repo']);
      }
      
      if (params['prno']) {
        this.surveyForm.get('prNumber')?.setValue(params['prno']);
      }
      
      // Handle GitHub URL parsing
      if (params['url'] && params['url'].includes('github.com')) {
        const { org, repo, prNumber } = this.parseGitHubPRUrl(params['url']);
        if (!params['repo'] && repo) {
          this.surveyForm.get('repo')?.setValue(repo);
        }
        if (!params['prno'] && prNumber) {
          this.surveyForm.get('prNumber')?.setValue(prNumber);
        }
      }
    });

    // Get organization
    this.installationsService.currentInstallation.subscribe(installation => {
      this.orgFromApp = installation?.account?.login || '';
    });

    this.loadHistoricalReasons();

    // Handle Copilot usage toggle
    this.surveyForm.get('usedCopilot')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.surveyForm.get('percentTimeSaved')?.setValue(0);
      } else {
        this.surveyForm.get('percentTimeSaved')?.setValue(this.defaultPercentTimeSaved);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    this.id = id ? Number(id) : 0; // Correct type conversion
  }
  
  loadHistoricalReasons() {
    this.copilotSurveyService.getAllSurveys({
      reasonLength: 20,
      org: this.orgFromApp
    }).subscribe((surveys: Survey[]) => {
      this.surveys = surveys;
    });
  }

  addKudos(survey: Survey) {
    if (survey && survey.id) {
      this.copilotSurveyService.updateSurvey({
        id: survey.id,
        kudos: survey.kudos ? survey.kudos + 1 : 1
      }).subscribe(() => {
        survey.kudos = (survey.kudos || 0) + 1;
      });
    }
  }

  parseGitHubPRUrl(url: string) {
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      return { org: '', repo: '', prNumber: NaN };
    }
    const pathSegments = urlObj.pathname.split('/');

    const org = pathSegments[1];
    const repo = pathSegments[2];
    const prNumber = Number(pathSegments[4]);
    return { org, repo, prNumber };
  }

  onSubmit() {
    if (this.surveyForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.surveyForm.controls).forEach(key => {
        this.surveyForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Validate the userId field using the userIdValidator before submission
    const userIdControl = this.surveyForm.get('userId');
    if (userIdControl && userIdControl.valid) {
      try {
        // Ensure userId is the login string before sending
        const userIdValue = userIdControl.value;
        const finalUserId = (typeof userIdValue === 'object' && userIdValue?.login) ? userIdValue.login : userIdValue;

        // Use fallbacks for org and repo
        const { org, repo, prNumber } = this.parseGitHubPRUrl(this.params['url'] || '');
        
        const survey = {
          id: this.id,
          userId: finalUserId,
          org: org || this.orgFromApp || 'default-org', // Add fallback
          repo: repo || this.surveyForm.value.repo || '',
          // Fix: Convert null to 0 to match required type
          prNumber: prNumber || Number(this.surveyForm.value.prNumber) || 0, // Use 0 instead of null
          usedCopilot: Boolean(this.surveyForm.value.usedCopilot),
          percentTimeSaved: Number(this.surveyForm.value.percentTimeSaved),
          reason: this.surveyForm.value.reason || '',
          timeUsedFor: this.surveyForm.value.timeUsedFor || ''
        };

        console.log('Submitting survey:', survey);

        if (!this.id) {
          this.copilotSurveyService.createSurvey(survey).pipe(
            catchError(error => {
              console.error('Error creating survey:', error);
              alert('Failed to submit survey. Please try again.');
              return of(null);
            })
          ).subscribe(result => {
            if (result) {
              this.router.navigate(['/copilot/survey']);
            }
          });
        } else {
          this.copilotSurveyService.createSurveyGitHub(survey).pipe(
            catchError(error => {
              console.error('Error creating GitHub survey:', error);
              alert('Failed to submit survey. Please try again.');
              return of(null);
            })
          ).subscribe(result => {
            if (result) {
              const redirectUrl = this.params['url'];
              if (redirectUrl && redirectUrl.startsWith('https://github.com/')) {
                window.location.href = redirectUrl;
              } else {
                console.error('Unauthorized URL:', redirectUrl);
                this.router.navigate(['/copilot/survey']);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error in form submission:', error);
        alert('An unexpected error occurred. Please try again.');
      }
    } else if (userIdControl) {
      // If control is invalid, trigger validation explicitly to show error
      userIdControl.markAsTouched();
      userIdValidator(this.membersService)(userIdControl).subscribe(validationResult => {
        if (validationResult) {
          userIdControl.setErrors(validationResult);
        }
      });
    }
  }

  formatPercent(value: number) {
    return `${value}%`
  }

  displayFn(member: Member | string | null): string {
    if (!member) return '';
    return typeof member === 'string' ? member : member.login || '';
  }

  /**
   * Handle when an option is selected from the autocomplete dropdown
   */
  onMemberSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedMember = event.option.value as Member;
    console.log('Member selected:', selectedMember); // Optional: for debugging

    // Set the value in the form and clear errors
    const userIdControl = this.surveyForm.get('userId');
    if (userIdControl) {
      userIdControl.setValue(selectedMember);
      userIdControl.setErrors(null);
    }
  }

  /**
   * Handle blur event on the userId input field
   */
  onUserIdBlur(): void {
    // Add a small delay to allow the optionSelected event to process first
    setTimeout(() => {
      const userIdControl = this.surveyForm.get('userId');
      const userId = userIdControl?.value;

      console.log('onUserIdBlur called with value:', userId); // Optional: for debugging

      // Skip validation if the value is already a Member object (meaning an option was selected)
      if (userId && typeof userId !== 'string' && userId.login) {
        console.log('Value is a Member object, skipping validation'); // Optional: for debugging
        return;
      }

      // Otherwise, proceed with validation for the string value
      this.validateUserIdOnBlur();
    }, 100); // 100ms delay, adjust if needed
  }

  /**
   * Validates the userId when the input field loses focus (and no option was selected)
   * Uses the getMemberByLogin method with exact=true for case-insensitive validation
   * Then replaces the input with the correctly cased username
   */
  validateUserIdOnBlur(): void {
    const userIdControl = this.surveyForm.get('userId');
    const userId = userIdControl?.value;

    console.log('Validating userId:', userId); // Optional: for debugging

    // Skip validation if empty (let the required validator handle this)
    if (!userId) {
      return;
    }

    // Double-check: If the value is somehow a Member object, it's valid
    if (typeof userId !== 'string' && userId.login) {
      userIdControl?.setErrors(null);
      return;
    }

    // Only validate if the value is a string (user typed it in and didn't select an option)
    if (typeof userId === 'string') {
      console.log('Validating string value:', userId); // Optional: for debugging

      // Set loading state
      this.isLoading$.next(true);

      // Call validation method with exact=true for case-insensitive matching
      this.membersService.getMemberByLogin(userId, true).pipe(
        catchError(error => {
          console.error('Error validating user ID:', error);
          userIdControl?.setErrors({ invalidUserId: true });
          return of(null);
        }),
        finalize(() => {
          this.isLoading$.next(false);
        })
      ).subscribe(result => {
        if (result) {
          // Valid user - clear errors
          userIdControl?.setErrors(null);

          // Always update to the correctly cased username from the API
          userIdControl?.setValue(result);

          console.log('User validated and updated to correct case:', result.login); // Optional: for debugging
        } else {
          // Invalid user (and not caught by catchError, e.g., API returned null)
          if (!userIdControl?.hasError('invalidUserId')) { // Avoid overwriting existing error
             userIdControl?.setErrors({ invalidUserId: true });
          }
        }
      });
    }
  }
}
