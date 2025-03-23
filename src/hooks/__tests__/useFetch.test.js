import { renderHook, act } from '@testing-library/react-hooks';
import axios from 'axios';
import useFetch from '../useFetch';

jest.mock('axios');

describe('useFetch Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error to avoid test output pollution
  });

  test('should return initial data when provided', () => {
    const initialData = { test: 'initial' };
    const { result } = renderHook(() => useFetch('/api/test', { initialData }));
    
    expect(result.current.data).toEqual(initialData);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('should fetch data successfully', async () => {
    const responseData = { test: 'response' };
    axios.get.mockResolvedValueOnce({ data: responseData });
    
    const { result, waitForNextUpdate } = renderHook(() => useFetch('/api/test'));
    
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(responseData);
    expect(result.current.error).toBeNull();
    expect(axios.get).toHaveBeenCalledWith('/api/test', { withCredentials: true });
  });

  test('should handle fetch errors', async () => {
    axios.get.mockRejectedValueOnce(new Error('API error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useFetch('/api/test'));
    
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Fehler beim Laden der Daten');
    expect(console.error).toHaveBeenCalled();
  });

  test('should allow manual data refetching', async () => {
    const firstResponse = { test: 'first' };
    const secondResponse = { test: 'second' };
    
    axios.get
      .mockResolvedValueOnce({ data: firstResponse })
      .mockResolvedValueOnce({ data: secondResponse });
    
    const { result, waitForNextUpdate } = renderHook(() => useFetch('/api/test'));
    
    await waitForNextUpdate();
    expect(result.current.data).toEqual(firstResponse);
    
    // Manually refetch data
    await act(async () => {
      await result.current.fetchData();
    });
    
    expect(result.current.data).toEqual(secondResponse);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
