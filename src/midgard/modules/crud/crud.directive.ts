import {Directive, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription} from 'rxjs';
import {GraphQlService} from '@src/midgard/modules/graphql/graphql.service';
import {map} from 'rxjs/operators';
import {select, Store} from '@src/midgard/modules/store/store';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Directive({
  selector: '[mgCrud]',
  exportAs: 'mgCrud'
})
export class CrudDirective implements OnInit, OnDestroy {

  public rows: any = [];
  public currentItem;
  public detailsForm: FormGroup;
  public dataLoaded;
  private graphQlSubscription: Subscription;
  private storeSubscription: Subscription;

  @Input() loadAction;
  /**
   * redux action to load data from Graph QL
   */
  @Input() loadActionGraphQl;
  /**
   * redux action to create an item
   */
  @Input() createAction;
  /**
   * redux action to update an item
   */
  @Input() updateAction;
  /**
   * redux action to delete an item
   */
  @Input() deleteAction;
  /**
   * notification message when the item is created
   */
  @Input() createMessage;
  /**
   * notification message when the item is update
   */
  @Input() updateMessage;
  /**
   * notification message when the item is deleted
   */
  @Input() deleteMessage;

  /**
   * redux selector function to retrieve data list
   */
  @Input() dataSelector;
  /**
   * redux selector function to check if the data is loaded
   */
  @Input() loadedSelector;
  /**
   * definition of the form fields
   */
  @Input() formFields;
  /**
   * event that is triggered when the data is loaded
   */
  @Output() dataLoadedFromStore: EventEmitter<any> = new EventEmitter();

  constructor(
    private store: Store<any>, // type {any} beacuse the state of the app is not fixed and can be changed depending on the modules
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.dataLoaded = this.store.observable.pipe(
      select(this.loadedSelector),
      map(loaded => {
        if (loaded) {
          return loaded;
        }
      })
    );
    this.listenToStore();
    this.getDataFromStore();
  }

  /**
   * listen to redux store changes
   */
  listenToStore() {
    this.storeSubscription = this.store.observable.pipe(
      select(this.dataSelector),
    ).subscribe( (data: any[]) => {
      if (data) {
        this.rows = data;
        this.dataLoadedFromStore.emit(this.rows);
      }
    });
  }

  /**
   * gets data from redux store depending on the given loadAction (input)
   */
  getDataFromStore() {
    this.store.dispatch({
      type: this.loadAction,
    });
  }
  /**
   * send a request to create an item from the list
   * @param item - item to be created
   * @param index - index of where to push the item in the state
   */
  createItem(item: any, index?: number) {
    this.store.dispatch({
      type: this.createAction,
      data: item,
      index
    });
  }

  /**
   * send a request to delete an item from the list
   * @param item - selected item
   */
  deleteItem(item: any) {
    this.store.dispatch({
      type: this.deleteAction,
      data: item,
    });
  }

  /**
   * send a request to update an item from the list
   * @param item - selected item
   */
  updateItem(item: any) {
    this.store.dispatch({
      type: this.updateAction,
      data: item,
    });
  }

  /**
   * build the reactive form with the given formFields
   */
  buildForm() {
    const controlsConfig = this.formFields.reduce((result, currentValue) => {
      let validatorsArr = [];
      if (currentValue.validators) {
        validatorsArr = currentValue.validators.reduce((arr, validatorName) => {
          arr.push(Validators[validatorName]);
          return arr;
        }, []);
      }
      if (this.currentItem) {
        result[currentValue.controlName] = [this.currentItem[currentValue.controlName], validatorsArr];
      } else {
        result[currentValue.controlName] = ['', validatorsArr];
      }
      return result;
    }, {});
    this.detailsForm = this.fb.group(controlsConfig);
  }

  ngOnDestroy() {
    if (this.graphQlSubscription) {
      this.graphQlSubscription.unsubscribe();
    }
    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
    }
  }

}
